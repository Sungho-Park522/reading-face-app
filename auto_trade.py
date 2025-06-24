import requests
import time
import hmac
import hashlib
import base64
import json
from datetime import datetime

# === 설정 ===
ACCESS_TOKEN = 'ae437cfc-b806-4798-88e7-5954b8745fb7'
SECRET_KEY = '0810c158-7bf7-47f0-97c1-a4c90e85a8e5'
CURRENCY = 'VIRTUAL'
REWARD_THRESHOLD = 0.005  # 리워드 범위: -0.5%
ORDER_OFFSET = 0.0045      # 실제 주문가: -0.45%
KRW_AMOUNT = 45000
MONITOR_INTERVAL = 3
EXECUTION_RISK_THRESHOLD = 0.003
CANCEL_WAIT_TIME = 2.0

API_BASE = 'https://api.coinone.co.kr'

# 전역 변수
current_order_id = None
current_order_price = None
current_order_base_price = None

def log(message):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

def get_price():
    """현재가 조회"""
    url = f'{API_BASE}/ticker/?currency={CURRENCY.lower()}'
    try:
        res = requests.get(url, timeout=10)
        data = res.json()
        
        if data.get('result') == 'success' and 'last' in data:
            return float(data['last'])
        return None
    except Exception as e:
        log(f"❌ 시세 조회 에러: {e}")
        return None

def build_headers(payload):
    """헤더 생성"""
    try:
        json_payload = json.dumps(payload, separators=(',', ':'))
        encoded = base64.b64encode(json_payload.encode('utf-8'))
        signature = hmac.new(
            SECRET_KEY.encode('utf-8'), 
            encoded, 
            hashlib.sha512
        ).hexdigest()
        
        return {
            'X-COINONE-PAYLOAD': encoded.decode('utf-8'),
            'X-COINONE-SIGNATURE': signature,
            'Content-Type': 'application/json'
        }
    except Exception as e:
        log(f"❌ 헤더 생성 에러: {e}")
        return {}

def send_request(endpoint, body):
    """API 요청"""
    try:
        payload = {
            'access_token': ACCESS_TOKEN,
            'nonce': int(time.time() * 1000),
            **body
        }
        
        headers = build_headers(payload)
        if not headers:
            return {'result': 'error', 'errorMsg': 'Header generation failed'}
        
        url = API_BASE + endpoint
        time.sleep(0.3)  # API 호출 간격
        response = requests.post(url, headers=headers, timeout=15)
        
        try:
            result = response.json()
            return result
        except json.JSONDecodeError:
            log(f"❌ JSON 파싱 실패 ({endpoint}): 상태코드 {response.status_code}")
            return {'result': 'error', 'errorMsg': 'JSON parsing failed'}
            
    except Exception as e:
        log(f"❌ 요청 에러 ({endpoint}): {e}")
        return {'result': 'error', 'errorMsg': str(e)}

def get_target_balance():
    """타겟 코인 잔고만 조회"""
    result = send_request('/v2/account/balance', {})
    
    if result.get('result') != 'success':
        log(f"❌ 잔고 조회 실패: {result.get('errorMsg', 'Unknown')}")
        return {'krw': 0, 'coin': 0}
    
    # KRW 잔고
    krw_data = result.get('krw', {})
    krw_balance = float(krw_data.get('avail', '0'))
    
    # 타겟 코인 잔고만
    coin_key = CURRENCY.lower()
    coin_data = result.get(coin_key, {})
    coin_balance = float(coin_data.get('avail', '0'))
    
    log(f"💰 잔고 - KRW: {krw_balance:,.0f}원, {CURRENCY}: {coin_balance:.8f}")
    
    return {'krw': krw_balance, 'coin': coin_balance}

def calculate_buy_quantity(price):
    """매수 수량 계산"""
    balance = get_target_balance()
    available_krw = min(balance['krw'], KRW_AMOUNT)
    
    if available_krw < 1000:
        log(f"⚠️ 사용 가능 KRW 부족: {available_krw:,.0f}원")
        return 0
    
    qty = (available_krw * 0.999) / price
    return max(qty, 0.0001)

def place_buy_order(current_price):
    """매수 주문 등록"""
    global current_order_id, current_order_price, current_order_base_price
    
    order_price = round(current_price * (1 - ORDER_OFFSET))
    qty = calculate_buy_quantity(order_price)
    
    if qty <= 0.0001:
        log("❌ 매수 주문 불가 (잔고 부족)")
        return None
    
    qty_formatted = f"{qty:.8f}"
    log(f"🛒 매수 주문: {qty_formatted} {CURRENCY} @ {order_price:,}원")
    
    result = send_request('/v2/order/limit_buy', {
        'price': str(order_price),
        'qty': qty_formatted,
        'currency': CURRENCY
    })
    
    if result.get('result') == 'success':
        current_order_id = result.get('orderId')
        current_order_price = order_price
        current_order_base_price = current_price
        log(f"✅ 매수 주문 성공: {current_order_id}")
        return current_order_id
    else:
        error_msg = result.get('errorMsg', 'Unknown error')
        log(f"❌ 매수 주문 실패: {error_msg}")
        return None

def check_order_status():
    """주문 상태 확인"""
    global current_order_id
    
    if not current_order_id:
        return "NO_ORDER"
    
    result = send_request('/v2/order/limit_orders', {'currency': CURRENCY})
    if result.get('result') == 'success':
        open_orders = result.get('limitOrders', [])
        
        for order in open_orders:
            if order['orderId'] == current_order_id:
                return "PENDING"
        
        return "FILLED"
    
    return "ERROR"

def should_keep_order(current_price):
    """주문 유지 여부 판단"""
    global current_order_price, current_order_base_price
    
    if not current_order_price or not current_order_base_price:
        return False, "NO_ORDER_INFO"
    
    # 리워드 범위 체크
    current_reward_threshold = current_price * (1 - REWARD_THRESHOLD)
    original_reward_threshold = current_order_base_price * (1 - REWARD_THRESHOLD)
    
    range_ok1 = current_order_price >= current_reward_threshold
    range_ok2 = current_order_price >= original_reward_threshold
    
    # 체결 위험 체크
    price_gap = (current_price - current_order_price) / current_price
    risk_ok = price_gap >= EXECUTION_RISK_THRESHOLD
    
    log(f"📋 주문 분석: 현재가 {current_price:,}원, 주문가 {current_order_price:,}원")
    log(f"   갭: {price_gap*100:.2f}%, 리워드범위: {'✅' if range_ok1 and range_ok2 else '❌'}, 위험도: {'✅' if risk_ok else '⚠️'}")
    
    if range_ok1 and range_ok2 and risk_ok:
        return True, "KEEP"
    elif not risk_ok:
        return False, "EXECUTION_RISK"
    else:
        return False, "RANGE_VIOLATION"

def cancel_current_order():
    """주문 취소"""
    global current_order_id, current_order_price, current_order_base_price
    
    if not current_order_id:
        return True
    
    order_id_backup = current_order_id
    log(f"🗑️ 주문 취소: {order_id_backup}")
    
    result = send_request('/v2/order/cancel', {
        'order_id': order_id_backup,
        'currency': CURRENCY
    })
    
    # 전역 변수 초기화
    current_order_id = None
    current_order_price = None
    current_order_base_price = None
    
    success = result.get('result') == 'success'
    if success:
        log("✅ 취소 완료")
        time.sleep(CANCEL_WAIT_TIME)
    else:
        log(f"❌ 취소 실패: {result.get('errorMsg', 'Unknown')}")
    
    return success

def place_immediate_limit_sell():
    """🔥 핵심 수정: 시장가가 아닌 지정가로 즉시 매도"""
    global current_order_id, current_order_price, current_order_base_price
    
    balance = get_target_balance()
    coin_balance = balance['coin']
    
    if coin_balance <= 0.0001:
        log("⚠️ 매도할 코인 없음")
        return False
    
    # 현재가 조회
    current_price = get_price()
    if not current_price:
        log("❌ 현재가 조회 실패로 매도 불가")
        return False
    
    # 🔥 핵심: 현재가보다 낮은 가격으로 지정가 매도 (빠른 체결)
    # 1% 할인된 가격으로 매도하여 즉시 체결 유도
    sell_price = int(current_price * 0.99)
    qty_formatted = f"{coin_balance:.8f}"
    
    log(f"🚨 즉시 지정가 매도: {qty_formatted} {CURRENCY} @ {sell_price:,}원 (현재가 -1%)")
    
    result = send_request('/v2/order/limit_sell', {
        'price': str(sell_price),
        'qty': qty_formatted,
        'currency': CURRENCY
    })
    
    if result.get('result') == 'success':
        sell_order_id = result.get('orderId')
        log(f"✅ 지정가 매도 주문 성공: {sell_order_id}")
        
        # 🔥 중요: 매수 주문 상태 초기화 (매도 시작하면 매수는 완료된 것)
        current_order_id = None
        current_order_price = None
        current_order_base_price = None
        log("🔄 매수 주문 상태 초기화 완료")
        
        # 매도 주문 체결 대기 (최대 10초)
        log("⏳ 매도 체결 대기 중...")
        for i in range(10):
            time.sleep(1)
            
            # 매도 주문 체결 확인
            sell_check = send_request('/v2/order/limit_orders', {'currency': CURRENCY})
            if sell_check.get('result') == 'success':
                sell_orders = sell_check.get('limitOrders', [])
                
                # 매도 주문이 목록에 없으면 체결됨
                if not any(order['orderId'] == sell_order_id for order in sell_orders):
                    log("🎉 매도 체결 완료!")
                    return True
        
        log("⚠️ 매도 체결 대기 시간 초과 (하지만 주문은 등록됨)")
        return True
        
    else:
        error_msg = result.get('errorMsg', 'Unknown error')
        log(f"❌ 지정가 매도 실패: {error_msg}")
        
        # 🔥 매도 실패해도 매수 상태는 초기화
        current_order_id = None
        current_order_price = None
        current_order_base_price = None
        log("🔄 매수 주문 상태 초기화 (매도 실패)")
        
        # 백업: 더 낮은 가격으로 재시도
        if "minimum" not in error_msg.lower():
            backup_price = int(current_price * 0.95)  # 5% 할인
            log(f"🔄 백업 매도 시도: {backup_price:,}원 (현재가 -5%)")
            
            backup_result = send_request('/v2/order/limit_sell', {
                'price': str(backup_price),
                'qty': qty_formatted,
                'currency': CURRENCY
            })
            
            if backup_result.get('result') == 'success':
                log("✅ 백업 매도 성공")
                return True
        
        return False

def run_clean_trading():
    """메인 매매 로직"""
    log("🚀 코인원 리워드 자동매매 시작")
    log(f"📊 설정: {CURRENCY}, 주문금액: {KRW_AMOUNT:,}원")
    log("💡 주의: 코인원은 시장가 매도가 없어서 지정가 매도로 처리됩니다")
    
    # 초기 상태 확인
    balance = get_target_balance()
    current_price = get_price()
    
    if not current_price:
        log("❌ 초기 가격 조회 실패")
        return
    
    log(f"📈 시작 가격: {current_price:,}원")
    
    # 🔥 이미 코인을 보유중이면 매도부터
    if balance['coin'] > 0.0001:
        log("🔍 기존 코인 보유 감지 → 매도 먼저 진행")
        if place_immediate_limit_sell():
            log("💰 기존 코인 매도 완료")
        time.sleep(3)
    
    consecutive_errors = 0
    
    while True:
        try:
            # 에러 카운트 체크
            if consecutive_errors >= 5:
                log("🛑 연속 에러 5회 초과, 종료")
                break
            
            log(f"\n{'='*40}")
            
            # 현재가 조회
            current_price = get_price()
            if not current_price:
                log("⚠️ 가격 조회 실패")
                consecutive_errors += 1
                time.sleep(MONITOR_INTERVAL)
                continue
            
            log(f"📈 현재가: {current_price:,}원")
            
            # 주문 상태 확인
            order_status = check_order_status()
            log(f"📊 주문 상태: {order_status}")
            
            if order_status == "FILLED":
                # 체결됨 → 즉시 매도 (지정가)
                log("🎯 매수 체결! 즉시 매도 실행")
                sell_success = place_immediate_limit_sell()
                
                if sell_success:
                    log("💰 거래 완료 - 수익 실현!")
                    consecutive_errors = 0  # 성공 시 에러 카운트 리셋
                else:
                    log("⚠️ 매도 실패했지만 매수 상태는 초기화됨")
                    consecutive_errors = 0  # 🔥 매도 실패해도 에러 카운트 리셋 (매수는 완료됨)
                
                time.sleep(3)  # 다음 사이클 전 잠시 대기
                continue
            
            elif order_status == "PENDING":
                # 미체결 → 유지 여부 판단
                keep_order, reason = should_keep_order(current_price)
                
                if keep_order:
                    log("✅ 기존 주문 유지")
                    consecutive_errors = 0
                    time.sleep(MONITOR_INTERVAL)
                    continue
                else:
                    log(f"🔄 주문 갱신: {reason}")
                    cancel_current_order()
            
            elif order_status == "NO_ORDER":
                log("📝 활성 주문 없음")
            
            else:  # ERROR
                log("❌ 주문 상태 확인 실패")
                consecutive_errors += 1
                time.sleep(MONITOR_INTERVAL)
                continue
            
            # 새로운 매수 주문
            if place_buy_order(current_price):
                consecutive_errors = 0
            else:
                consecutive_errors += 1
            
            time.sleep(MONITOR_INTERVAL)
            
        except KeyboardInterrupt:
            log("🛑 사용자 종료")
            if current_order_id:
                cancel_current_order()
            break
        except Exception as e:
            log(f"❌ 예상치 못한 오류: {e}")
            consecutive_errors += 1
            time.sleep(MONITOR_INTERVAL)
    
    log("🏁 프로그램 종료")

if __name__ == '__main__':
    log("🔍 초기 연결 테스트")
    
    test_price = get_price()
    if test_price:
        log(f"✅ 연결 성공. 현재가: {test_price:,}원")
        run_clean_trading()
    else:
        log("❌ 연결 실패. 설정을 확인하세요.")