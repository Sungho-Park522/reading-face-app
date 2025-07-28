import requests
import time
import hmac
import hashlib
import base64
import json
from datetime import datetime
import math

# === 설정 ===
ACCESS_TOKEN = 'ae437cfc-b806-4798-88e7-5954b8745fb7'
SECRET_KEY = '0810c158-7bf7-47f0-97c1-a4c90e85a8e5'
CURRENCY = 'VIRTUAL'
REWARD_THRESHOLD = 0.005  # 리워드 범위: -0.5%
ORDER_OFFSET = 0.0025     # 실제 주문가: -0.45%
KRW_AMOUNT = 43900
MONITOR_INTERVAL = 3
EXECUTION_RISK_THRESHOLD = 0.001
CANCEL_WAIT_TIME = 2.0
MIN_BUY_WALL = 50       # 🔥 최소 매수벽 수량 (5천개)

# 🔥 새로 추가: 가격 단위 설정
PRICE_UNIT = 1.0         # 가격 단위 (예: 1.0 = 1원 단위, 0.1 = 0.1원 단위, 10.0 = 10원 단위)
PRICE_DECIMALS = 0       # 소수점 자릿수 (예: 0 = 정수, 1 = 소수점 첫째자리)

# 🔥 가격 단위별 설정 예시:
# 1원 단위: PRICE_UNIT = 1.0, PRICE_DECIMALS = 0
# 0.1원 단위: PRICE_UNIT = 0.1, PRICE_DECIMALS = 1  
# 0.01원 단위: PRICE_UNIT = 0.01, PRICE_DECIMALS = 2
# 10원 단위: PRICE_UNIT = 10.0, PRICE_DECIMALS = 0
# 100원 단위: PRICE_UNIT = 100.0, PRICE_DECIMALS = 0

API_BASE = 'https://api.coinone.co.kr'

# 전역 변수
current_order_id = None
current_order_price = None
current_order_base_price = None

# 매도 주문 추적 변수
current_sell_order_id = None
current_sell_order_price = None
current_sell_base_price = None

def log(message):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

def round_to_price_unit(price):
    """🔥 가격을 설정된 단위로 반올림"""
    if PRICE_UNIT <= 0:
        return round(price)
    
    # 가격 단위로 나누고 반올림한 후 다시 곱함
    rounded_price = round(price / PRICE_UNIT) * PRICE_UNIT
    
    # 소수점 자릿수 적용
    return round(rounded_price, PRICE_DECIMALS)

def format_price(price):
    """🔥 가격을 설정된 소수점 자릿수로 포맷팅"""
    return f"{price:.{PRICE_DECIMALS}f}"

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

def get_orderbook():
    """호가창 조회"""
    url = f'{API_BASE}/orderbook/?currency={CURRENCY.lower()}'
    try:
        res = requests.get(url, timeout=10)
        data = res.json()
        
        if data.get('result') == 'success':
            bids = data.get('bid', [])  # 매수 호가
            asks = data.get('ask', [])  # 매도 호가
            
            # 가격순 정렬
            bids_sorted = sorted(bids, key=lambda x: float(x['price']), reverse=True)
            asks_sorted = sorted(asks, key=lambda x: float(x['price']))
            
            return {'bids': bids_sorted, 'asks': asks_sorted}
        else:
            log(f"❌ 호가창 조회 실패: {data}")
            return None
    except Exception as e:
        log(f"❌ 호가창 조회 에러: {e}")
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
        time.sleep(0.3)
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
    """타겟 코인 잔고 조회"""
    result = send_request('/v2/account/balance', {})
    
    if result.get('result') != 'success':
        log(f"❌ 잔고 조회 실패: {result.get('errorMsg', 'Unknown')}")
        return {'krw': 0, 'coin': 0}
    
    krw_data = result.get('krw', {})
    krw_balance = float(krw_data.get('avail', '0'))
    
    coin_key = CURRENCY.lower()
    coin_data = result.get(coin_key, {})
    coin_balance = float(coin_data.get('avail', '0'))
    
    log(f"💰 잔고 - KRW: {krw_balance:,.0f}원, {CURRENCY}: {coin_balance:.8f}")
    
    return {'krw': krw_balance, 'coin': coin_balance}

def step1_check_and_sell_existing_coins():
    """🔥 1단계: 타겟 코인 잔고 확인 및 매도"""
    log("🔍 1단계: 타겟 코인 잔고 확인...")
    
    balance = get_target_balance()
    coin_balance = balance['coin']
    
    if coin_balance <= 0.0001:
        log("✅ 매도할 코인 없음 - 매수 로직으로 진행")
        return True
    
    log(f"📦 타겟 코인 발견: {coin_balance:.8f} {CURRENCY}")
    log("🎯 가장 가까운 가격으로 지정가 매도 진행")
    
    # 현재가 및 호가창 조회
    current_price = get_price()
    if not current_price:
        log("❌ 현재가 조회 실패")
        return False
    
    orderbook = get_orderbook()
    if not orderbook or not orderbook['asks']:
        log("⚠️ 호가창 정보 없음, 현재가 기준으로 매도")
        # 🔥 가격 단위 적용
        sell_price = round_to_price_unit(current_price * 0.999)
    else:
        # 🔥 가장 가까운 매도 호가 찾기
        best_ask_price = float(orderbook['asks'][0]['price'])
        # 🔥 가격 단위 적용: 최저 매도 호가보다 1단위 낮게
        sell_price = round_to_price_unit(best_ask_price - PRICE_UNIT)
        log(f"📊 최저 매도 호가: {format_price(best_ask_price)}원 → 매도가: {format_price(sell_price)}원")
    
    qty_formatted = f"{coin_balance:.8f}"
    log(f"🚨 지정가 매도: {qty_formatted} {CURRENCY} @ {format_price(sell_price)}원")
    
    result = send_request('/v2/order/limit_sell', {
        'price': format_price(sell_price),
        'qty': qty_formatted,
        'currency': CURRENCY
    })
    
    if result.get('result') == 'success':
        sell_order_id = result.get('orderId')
        log(f"✅ 매도 주문 성공: {sell_order_id}")
        
        # 매도 체결 대기 (최대 10초)
        log("⏳ 매도 체결 대기...")
        for i in range(10):
            time.sleep(1)
            
            sell_check = send_request('/v2/order/limit_orders', {'currency': CURRENCY})
            if sell_check.get('result') == 'success':
                sell_orders = sell_check.get('limitOrders', [])
                
                if not any(order['orderId'] == sell_order_id for order in sell_orders):
                    log("🎉 매도 체결 완료!")
                    return True
        
        log("⏳ 매도 미체결, 매수 보류")
        return False
        
    else:
        log(f"❌ 매도 실패: {result.get('errorMsg', 'Unknown')}")
        return False

def step2_calculate_prices(current_price):
    """🔥 2-1단계: 각 가격 계산"""
    # 리워드 범위 계산
    reward_threshold = current_price * (1 - REWARD_THRESHOLD)
    
    # 🔥 지정가 주문 가격 계산 (가격 단위 적용)
    order_price = round_to_price_unit(current_price * (1 - ORDER_OFFSET))
    
    # 위험 범위 계산 (체결 위험 임계점)
    risk_threshold = current_price * (1 - EXECUTION_RISK_THRESHOLD)
    
    log(f"💰 가격 계산 결과:")
    log(f"   현재가: {format_price(current_price)}원")
    log(f"   리워드 하한선: {format_price(reward_threshold)}원 (-0.5%)")
    log(f"   지정가 주문: {format_price(order_price)}원 (-0.45%)")
    log(f"   위험 임계점: {format_price(risk_threshold)}원 (-0.3%)")
    log(f"   가격 단위: {PRICE_UNIT}원, 소수점: {PRICE_DECIMALS}자리")
    
    return {
        'current': current_price,
        'reward_threshold': reward_threshold,
        'order_price': order_price,
        'risk_threshold': risk_threshold
    }

def step2_check_buy_wall(order_price):
    """🔥 2-2단계: 매수벽 확인 (5천개 이상)"""
    log(f"🔍 2-2단계: 매수벽 확인 (주문가 {format_price(order_price)}원 기준)")
    
    orderbook = get_orderbook()
    if not orderbook or not orderbook['bids']:
        log("❌ 호가창 정보 없음, 매수 보류")
        return False, 0
    
    # 지정가 주문보다 높은 가격의 매수 물량 합계 계산
    total_buy_volume = 0
    buy_wall_count = 0
    
    log("📊 매수벽 분석:")
    for bid in orderbook['bids']:
        bid_price = float(bid['price'])
        bid_qty = float(bid['qty'])
        
        if bid_price > order_price:  # 우리 주문가보다 높은 가격
            total_buy_volume += bid_qty
            buy_wall_count += 1
            
            if buy_wall_count <= 5:  # 상위 5개만 로그 출력
                log(f"   {format_price(bid_price)}원: {bid_qty:,.0f}개")
    
    log(f"📈 매수벽 합계: {total_buy_volume:,.0f}개 (기준: {MIN_BUY_WALL:,}개)")
    
    if total_buy_volume >= MIN_BUY_WALL:
        log(f"✅ 매수벽 충분! 안전 진입 가능")
        return True, total_buy_volume
    else:
        log(f"⚠️ 매수벽 부족! 진입 보류 (부족: {MIN_BUY_WALL - total_buy_volume:,.0f}개)")
        return False, total_buy_volume

def step2_buy_logic():
    """🔥 2단계: 매수 로직 진입"""
    log("🔍 2단계: 매수 로직 진입")
    
    # 현재가 조회
    current_price = get_price()
    if not current_price:
        log("❌ 현재가 조회 실패")
        return None
    
    # 2-1: 각 가격 계산
    prices = step2_calculate_prices(current_price)
    
    # 2-2: 매수벽 확인
    wall_ok, wall_volume = step2_check_buy_wall(prices['order_price'])
    
    if not wall_ok:
        log("🛑 매수벽 부족으로 진입 보류")
        return None
    
    # 2-3: 매수 주문 실행
    return execute_buy_order(prices)

def execute_buy_order(prices):
    """매수 주문 실행"""
    global current_order_id, current_order_price, current_order_base_price
    
    order_price = prices['order_price']
    current_price = prices['current']
    
    # 🔥 중요: 매수 직전 다시 한번 잔고 확인
    if not step1_check_and_sell_existing_coins():
        log("⚠️ 매수 직전 코인 잔고 발견, 매수 보류")
        return None
    
    # 수량 계산
    balance = get_target_balance()
    available_krw = min(balance['krw'], KRW_AMOUNT)
    
    if available_krw < 1000:
        log(f"❌ 매수 불가 (잔고 부족: {available_krw:,.0f}원)")
        return None
    
    qty = (available_krw * 0.999) / order_price
    qty_formatted = f"{qty:.8f}"
    
    log(f"🛒 매수 주문 실행: {qty_formatted} {CURRENCY} @ {format_price(order_price)}원")
    
    result = send_request('/v2/order/limit_buy', {
        'price': format_price(order_price),
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

def step3_monitor_order():
    """🔥 3단계: 지정가 주문 모니터링"""
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

def monitor_sell_order():
    """매도 주문 상태 확인"""
    global current_sell_order_id
    
    if not current_sell_order_id:
        return "NO_SELL_ORDER"
    
    result = send_request('/v2/order/limit_orders', {'currency': CURRENCY})
    if result.get('result') == 'success':
        open_orders = result.get('limitOrders', [])
        for order in open_orders:
            if order['orderId'] == current_sell_order_id:
                return "PENDING"
        return "FILLED"
    return "ERROR"

def should_keep_sell_order(current_price):
    """매도 주문 유지 여부 판단"""
    global current_sell_order_price, current_sell_base_price
    
    if not current_sell_order_price or not current_sell_base_price:
        return False, "NO_ORDER_INFO"
    
    reward_cap = current_price * (1 + REWARD_THRESHOLD)
    original_cap = current_sell_base_price * (1 + REWARD_THRESHOLD)
    
    within_range = current_sell_order_price <= reward_cap and current_sell_order_price <= original_cap
    
    log(f"📋 매도 주문 분석: 현재가 {format_price(current_price)}원, 주문가 {format_price(current_sell_order_price)}원")
    log(f"   리워드 범위: {'✅' if within_range else '❌'}")
    
    if within_range:
        return True, "KEEP"
    else:
        return False, "RANGE_EXCEEDED"

def cancel_and_replace_sell(current_price, coin_qty):
    """매도 주문 취소 및 재등록"""
    global current_sell_order_id, current_sell_order_price, current_sell_base_price

    if current_sell_order_id:
        send_request('/v2/order/cancel', {
            'order_id': current_sell_order_id,
            'currency': CURRENCY
        })
        time.sleep(CANCEL_WAIT_TIME)

    # 🔥 호가창 기준 매도 가격 계산
    orderbook = get_orderbook()
    if not orderbook or not orderbook['asks']:
        log("⚠️ 호가창 정보 없음, 현재가 기준으로 매도")
        # 호가창이 없으면 현재가 + 0.1% 정도로 설정
        order_price = round_to_price_unit(current_price * 1.001)
    else:
        # 🔥 가장 가까운 매도 호가 찾기
        best_ask_price = float(orderbook['asks'][0]['price'])
        # 🔥 가격 단위 적용: 최저 매도 호가보다 1단위 낮게 (더 빨리 팔기 위해)
        order_price = round_to_price_unit(best_ask_price - PRICE_UNIT)
        log(f"📊 최저 매도 호가: {format_price(best_ask_price)}원 → 매도가: {format_price(order_price)}원")
    
    result = send_request('/v2/order/limit_sell', {
        'price': format_price(order_price),
        'qty': f"{coin_qty:.8f}",
        'currency': CURRENCY
    })

    if result.get('result') == 'success':
        current_sell_order_id = result.get('orderId')
        current_sell_order_price = order_price
        current_sell_base_price = current_price
        log(f"✅ 새로운 매도 주문 제출: {format_price(order_price)}원")
        return True
    else:
        log(f"❌ 매도 재등록 실패: {result.get('errorMsg', 'Unknown')}")
        return False

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
    
    log(f"📋 주문 분석: 현재가 {format_price(current_price)}원, 주문가 {format_price(current_order_price)}원")
    log(f"   갭: {price_gap*100:.2f}%, 리워드범위: {'✅' if range_ok1 and range_ok2 else '❌'}, 위험도: {'✅' if risk_ok else '⚠️'}")
    
    if range_ok1 and range_ok2 and risk_ok:
        return True, "KEEP"
    elif not risk_ok:
        return False, "EXECUTION_RISK"
    else:
        return False, "RANGE_VIOLATION"

def step4_cancel_and_restart():
    """🔥 4단계: 기존 주문 취소 및 재시작"""
    global current_order_id, current_order_price, current_order_base_price
    
    if not current_order_id:
        return True
    
    order_id_backup = current_order_id
    log(f"🗑️ 4단계: 기존 주문 취소 - {order_id_backup}")
    
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
        log("✅ 취소 완료 - 2단계 매수 로직으로 재진입")
        time.sleep(CANCEL_WAIT_TIME)
    else:
        log(f"❌ 취소 실패: {result.get('errorMsg', 'Unknown')}")
    
    return success

def handle_filled_order():
    """체결된 주문 처리"""
    global current_order_id, current_order_price, current_order_base_price
    
    log("🎯 매수 체결 감지!")
    
    # 매수 상태 즉시 초기화
    current_order_id = None
    current_order_price = None
    current_order_base_price = None
    log("🔄 매수 상태 초기화 완료")
    
    # 다음 사이클에서 1단계가 매도를 처리할 것임
    log("💡 다음 사이클에서 1단계 매도 로직이 처리합니다")
    return True

def handle_filled_sell_order():
    """매도 체결된 주문 처리"""
    global current_sell_order_id, current_sell_order_price, current_sell_base_price
    
    log("🎯 매도 체결 감지!")
    
    # 매도 상태 즉시 초기화
    current_sell_order_id = None
    current_sell_order_price = None
    current_sell_base_price = None
    log("🔄 매도 상태 초기화 완료")
    
    return True

def run_exact_safe_trading():
    """🔥 정확한 안전 매매 로직"""
    log("🚀 정확한 안전 매매 시작")
    log(f"📊 설정:")
    log(f"   코인: {CURRENCY}")
    log(f"   리워드 범위: -{REWARD_THRESHOLD*100:.1f}%")
    log(f"   주문 오프셋: -{ORDER_OFFSET*100:.2f}%")
    log(f"   위험 임계점: -{EXECUTION_RISK_THRESHOLD*100:.1f}%")
    log(f"   최소 매수벽: {MIN_BUY_WALL:,}개")
    log(f"   주문 금액: {KRW_AMOUNT:,}원")
    log(f"   🔥 가격 단위: {PRICE_UNIT}원, 소수점: {PRICE_DECIMALS}자리")
    
    consecutive_errors = 0
    
    while True:
        try:
            if consecutive_errors >= 5:
                log("🛑 연속 에러 5회 초과, 종료")
                break
            
            log(f"\n{'='*50}")
            log("🔄 새 사이클 시작")
            
            # 🔥 1단계: 타겟 코인 잔고 확인 및 매도
            balance = get_target_balance()
            
            # 🔥 매도 주문 감시 및 갱신 로직 추가
            if balance['coin'] > 0.0001:
                current_price = get_price()
                if current_price:
                    sell_status = monitor_sell_order()
                    if sell_status == "PENDING":
                        keep, reason = should_keep_sell_order(current_price)
                        if not keep:
                            log(f"🔄 매도 주문 갱신 필요: {reason}")
                            cancel_and_replace_sell(current_price, balance['coin'])
                            consecutive_errors = 0
                            time.sleep(MONITOR_INTERVAL)
                            continue
                        else:
                            log("✅ 기존 매도 주문 유지")
                            consecutive_errors = 0
                            time.sleep(MONITOR_INTERVAL)
                            continue
                    elif sell_status == "NO_SELL_ORDER":
                        log("📝 매도 주문 없음, 새 매도 주문 등록")
                        cancel_and_replace_sell(current_price, balance['coin'])
                        consecutive_errors = 0
                        time.sleep(MONITOR_INTERVAL)
                        continue
                    elif sell_status == "FILLED":
                        log("🎉 매도 체결 완료!")
                        handle_filled_sell_order()
                        consecutive_errors = 0
                        time.sleep(3)
                        continue
            
            if not step1_check_and_sell_existing_coins():
                log("⏳ 1단계에서 매도 처리 중, 다음 사이클 대기")
                consecutive_errors = 0
                time.sleep(MONITOR_INTERVAL)
                continue
            
            # 🔥 현재 주문 상태에 따른 분기
            order_status = step3_monitor_order()
            log(f"📊 주문 상태: {order_status}")
            
            if order_status == "FILLED":
                # 체결됨 → 상태 초기화, 다음 사이클에서 1단계가 매도 처리
                handle_filled_order()
                consecutive_errors = 0
                time.sleep(3)
                continue
            
            elif order_status == "PENDING":
                # 미체결 → 유지 여부 판단
                current_price = get_price()
                if not current_price:
                    consecutive_errors += 1
                    time.sleep(MONITOR_INTERVAL)
                    continue
                
                keep_order, reason = should_keep_order(current_price)
                
                if keep_order:
                    log("✅ 기존 주문 유지")
                    consecutive_errors = 0
                    time.sleep(MONITOR_INTERVAL)
                    continue
                else:
                    log(f"🔄 주문 갱신 필요: {reason}")
                    # 🔥 4단계: 취소 후 재시작
                    step4_cancel_and_restart()
            
            elif order_status == "NO_ORDER":
                log("📝 활성 주문 없음")
            
            else:  # ERROR
                log("❌ 주문 상태 확인 실패")
                consecutive_errors += 1
                time.sleep(MONITOR_INTERVAL)
                continue
            
            # 🔥 2단계: 매수 로직 진입
            if step2_buy_logic():
                consecutive_errors = 0
            else:
                consecutive_errors = 0  # 매수벽 부족은 에러가 아님
            
            time.sleep(MONITOR_INTERVAL)
            
        except KeyboardInterrupt:
            log("🛑 사용자 종료")
            if current_order_id:
                step4_cancel_and_restart()
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
        log(f"✅ 연결 성공. 현재가: {format_price(test_price)}원")
        run_exact_safe_trading()
    else:
        log("❌ 연결 실패. 설정을 확인하세요.")