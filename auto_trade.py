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
CURRENCY = 'VIRTUAL'  # 실제 거래 가능한 코인으로 변경 필요
REWARD_THRESHOLD = 0.005  # 리워드 범위: -0.5%
ORDER_OFFSET = 0.003      # 실제 주문가: -0.3%
KRW_AMOUNT = 47000
MONITOR_INTERVAL = 2      # 2초마다 모니터링

API_BASE = 'https://api.coinone.co.kr'

# 전역 변수로 현재 주문 상태 관리
current_order_id = None
current_order_price = None
last_current_price = None

def log(message):
    """로깅 함수"""
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}")

def get_price():
    """1단계: 대상 코인 현재가격 모니터링"""
    url = f'{API_BASE}/ticker/?currency={CURRENCY.lower()}'
    try:
        res = requests.get(url, timeout=10)
        data = res.json()
        
        if data.get('result') == 'success' and 'last' in data:
            price = float(data['last'])
            return price
        else:
            log(f"❌ 시세 조회 실패: {data}")
            return None
    except Exception as e:
        log(f"❌ 시세 조회 에러: {e}")
        return None

def calculate_reward_prices(current_price):
    """2단계: 리워드 대상 가격대 계산"""
    # 리워드 범위 하한선 (-0.5%)
    reward_threshold = current_price * (1 - REWARD_THRESHOLD)
    # 실제 주문가 (-0.3%)
    order_price = current_price * (1 - ORDER_OFFSET)
    
    log(f"💰 가격 계산 - 현재가: {current_price:,.0f}원")
    log(f"   📊 리워드 하한선: {reward_threshold:,.0f}원 (-0.5%)")
    log(f"   🎯 주문 목표가: {order_price:,.0f}원 (-0.3%)")
    
    return reward_threshold, order_price

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
        response = requests.post(url, headers=headers, timeout=10)
        
        try:
            result = response.json()
            if result.get('result') != 'success':
                log(f"❌ API 에러 ({endpoint}): {result.get('errorCode', 'Unknown')} - {result.get('errorMsg', 'No message')}")
            return result
        except json.JSONDecodeError:
            log(f"❌ JSON 파싱 실패 ({endpoint}): {response.text}")
            return {'result': 'error', 'errorMsg': 'JSON parsing failed'}
            
    except Exception as e:
        log(f"❌ 요청 에러 ({endpoint}): {e}")
        return {'result': 'error', 'errorMsg': str(e)}

def place_buy_order(price, qty):
    """3단계: -0.3% 가격으로 지정가 매수 주문"""
    global current_order_id, current_order_price
    
    price_int = int(round(price))
    qty_formatted = f"{qty:.8f}"
    
    log(f"🛒 매수 주문 등록: {qty_formatted} {CURRENCY} @ {price_int:,}원")
    
    result = send_request('/v2/order/limit_buy', {
        'price': str(price_int),
        'qty': qty_formatted,
        'currency': CURRENCY
    })
    
    if result.get('result') == 'success':
        current_order_id = result.get('orderId')
        current_order_price = price_int
        log(f"✅ 매수 주문 성공: {current_order_id}")
        return current_order_id
    else:
        log(f"❌ 매수 주문 실패: {result.get('errorMsg', 'Unknown error')}")
        current_order_id = None
        current_order_price = None
        return None

def check_order_status():
    """4단계: 매수 주문 체결 여부 확인"""
    global current_order_id
    
    if not current_order_id:
        return "NO_ORDER"
    
    result = send_request('/v2/order/limit_orders', {'currency': CURRENCY})
    if result.get('result') == 'success':
        open_orders = result.get('limitOrders', [])
        
        # 현재 주문이 미체결 목록에 있는지 확인
        for order in open_orders:
            if order['orderId'] == current_order_id:
                return "PENDING"  # 미체결
        
        # 미체결 목록에 없으면 체결됨
        return "FILLED"
    
    return "ERROR"

def is_order_in_reward_range(current_price):
    """5-6단계: 기존 주문이 리워드 범위 내에 있는지 확인"""
    global current_order_price
    
    if not current_order_price:
        return False
    
    # 현재가 기준 리워드 하한선
    reward_threshold = current_price * (1 - REWARD_THRESHOLD)
    
    # 기존 주문가가 리워드 범위 내에 있는지 확인
    in_range = current_order_price >= reward_threshold
    
    log(f"📋 범위 검증 - 기존 주문가: {current_order_price:,}원, 하한선: {reward_threshold:,.0f}원")
    log(f"   {'✅ 범위 내 유지' if in_range else '❌ 범위 이탈'}")
    
    return in_range

def cancel_current_order():
    """7단계: 기존 주문 취소"""
    global current_order_id, current_order_price
    
    if not current_order_id:
        return True
    
    log(f"🗑️ 기존 주문 취소: {current_order_id}")
    result = send_request('/v2/order/cancel', {
        'order_id': current_order_id,
        'currency': CURRENCY
    })
    
    success = result.get('result') == 'success'
    if success:
        log("✅ 주문 취소 완료")
    else:
        log(f"❌ 주문 취소 실패: {result.get('errorMsg', 'Unknown error')}")
    
    current_order_id = None
    current_order_price = None
    return success

def place_market_sell():
    """8단계: 체결 시 즉시 시장가 매도"""
    # 잔고 조회하여 매도할 수량 확인
    balance_result = send_request('/v2/account/balance', {})
    if balance_result.get('result') != 'success':
        log("❌ 잔고 조회 실패")
        return False
    
    coin_balance = float(balance_result.get(CURRENCY.lower(), {}).get('avail', '0'))
    
    if coin_balance < 0.0001:  # 최소 매도 수량 체크
        log("⚠️ 매도할 코인 잔고 부족")
        return False
    
    qty_formatted = f"{coin_balance:.8f}"
    log(f"💸 즉시 시장가 매도: {qty_formatted} {CURRENCY}")
    
    result = send_request('/v2/order/market_sell', {
        'qty': qty_formatted,
        'currency': CURRENCY
    })
    
    if result.get('result') == 'success':
        log("🎉 시장가 매도 성공! 거래 완료")
        return True
    else:
        log(f"❌ 시장가 매도 실패: {result.get('errorMsg', 'Unknown error')}")
        return False

def calculate_buy_quantity(price):
    """매수 수량 계산"""
    # KRW 잔고 조회
    balance_result = send_request('/v2/account/balance', {})
    if balance_result.get('result') != 'success':
        return 0
    
    krw_balance = float(balance_result.get('krw', {}).get('avail', '0'))
    available_krw = min(krw_balance, KRW_AMOUNT)
    
    # 수수료 고려하여 수량 계산
    qty = (available_krw * 0.999) / price
    return max(qty, 0.0001)

def run_reward_trading():
    """메인 리워드 매매 로직"""
    global last_current_price
    
    log("🚀 코인원 리워드 자동매매 시작")
    log(f"📊 설정 - 코인: {CURRENCY}, 리워드 범위: -0.5%, 주문 오프셋: -0.3%")
    
    while True:
        try:
            # 1단계: 현재가격 모니터링
            current_price = get_price()
            if not current_price:
                log("⚠️ 가격 조회 실패, 재시도...")
                time.sleep(MONITOR_INTERVAL)
                continue
            
            # 가격 변화 로깅
            if last_current_price:
                change = ((current_price - last_current_price) / last_current_price) * 100
                log(f"📈 현재가: {current_price:,.0f}원 ({change:+.2f}%)")
            else:
                log(f"📈 현재가: {current_price:,.0f}원")
            
            last_current_price = current_price
            
            # 2단계: 리워드 가격 계산
            reward_threshold, target_order_price = calculate_reward_prices(current_price)
            
            # 4단계: 기존 주문 상태 확인
            order_status = check_order_status()
            
            if order_status == "FILLED":
                # 8단계: 체결됨 -> 즉시 시장가 매도
                log("🎯 매수 주문 체결 감지!")
                place_market_sell()
                time.sleep(1)  # 매도 처리 대기
                continue
            
            elif order_status == "PENDING":
                # 5-6단계: 미체결 -> 리워드 범위 내인지 확인
                if is_order_in_reward_range(current_price):
                    log("✅ 기존 주문 유지 (리워드 범위 내)")
                    time.sleep(MONITOR_INTERVAL)
                    continue
                else:
                    # 7단계: 범위 이탈 -> 주문 갱신
                    log("🔄 리워드 범위 이탈, 주문 갱신 필요")
                    cancel_current_order()
                    time.sleep(0.5)
            
            elif order_status == "NO_ORDER":
                log("📝 활성 주문 없음, 새 주문 등록")
            
            # 3단계: 새로운 매수 주문 등록
            buy_qty = calculate_buy_quantity(target_order_price)
            if buy_qty > 0.0001:
                place_buy_order(target_order_price, buy_qty)
            else:
                log("⚠️ 매수 가능 잔고 부족")
            
            time.sleep(MONITOR_INTERVAL)
            
        except KeyboardInterrupt:
            log("🛑 사용자 종료")
            # 종료 전 미체결 주문 정리
            if current_order_id:
                cancel_current_order()
            break
        except Exception as e:
            log(f"❌ 예상치 못한 오류: {e}")
            time.sleep(MONITOR_INTERVAL)

if __name__ == '__main__':
    # 초기 연결 테스트
    log("🔍 초기 연결 테스트...")
    test_price = get_price()
    if test_price:
        log(f"✅ 연결 성공. 시작 가격: {test_price:,.0f}원")
        run_reward_trading()
    else:
        log("❌ 연결 실패. 설정을 확인하세요.")