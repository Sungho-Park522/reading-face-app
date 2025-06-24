import requests
import time
import hmac
import hashlib
import base64
import json
from datetime import datetime

# === 수정된 설정 ===
ACCESS_TOKEN = 'ae437cfc-b806-4798-88e7-5954b8745fb7'
SECRET_KEY = '0810c158-7bf7-47f0-97c1-a4c90e85a8e5'
CURRENCY = 'VIRTUAL'  # 🔥 VIRTUAL → BTC로 변경!
REWARD_THRESHOLD = 0.005
ORDER_OFFSET = 0.003
KRW_AMOUNT = 40000
MONITOR_INTERVAL = 3
EXECUTION_RISK_THRESHOLD = 0.001
CANCEL_WAIT_TIME = 2.0
ORDER_RETRY_COUNT = 3
STATUS_VERIFY_COUNT = 2

API_BASE = 'https://api.coinone.co.kr'

# 전역 변수
current_order_id = None
current_order_price = None
current_order_base_price = None

def log(message):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

def debug_response(response, context=""):
    """🔍 API 응답 상세 디버깅"""
    log(f"🔍 API 응답 디버깅 ({context}):")
    log(f"   상태 코드: {response.status_code}")
    log(f"   헤더: {dict(response.headers)}")
    log(f"   Raw 응답 (처음 200자): {response.text[:200]}")
    log(f"   응답 길이: {len(response.text)}바이트")
    
    # Content-Type 확인
    content_type = response.headers.get('content-type', 'unknown')
    log(f"   Content-Type: {content_type}")
    
    # JSON 파싱 시도
    try:
        parsed = response.json()
        log(f"   JSON 파싱 성공: {parsed}")
        return parsed
    except json.JSONDecodeError as e:
        log(f"   ❌ JSON 파싱 실패: {e}")
        log(f"   전체 Raw 응답: {response.text}")
        return None

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

def send_request_debug(endpoint, body):
    """🔥 디버깅 강화된 API 요청"""
    try:
        payload = {
            'access_token': ACCESS_TOKEN,
            'nonce': int(time.time() * 1000),
            **body
        }
        
        log(f"🌐 API 요청 시작:")
        log(f"   엔드포인트: {endpoint}")
        log(f"   요청 데이터: {body}")
        
        headers = build_headers(payload)
        if not headers:
            return {'result': 'error', 'errorMsg': 'Header generation failed'}
        
        url = API_BASE + endpoint
        log(f"   전체 URL: {url}")
        
        # 요청 전 대기 (Rate Limit 방지)
        time.sleep(0.5)
        
        response = requests.post(url, headers=headers, timeout=15)
        
        # 🔥 응답 상세 디버깅
        parsed_data = debug_response(response, endpoint)
        
        if parsed_data is None:
            # JSON 파싱 실패 시 대체 처리
            if response.status_code == 200:
                log("   ⚠️ 200 OK이지만 JSON 아님 - HTML 에러 페이지일 가능성")
            
            return {
                'result': 'error', 
                'errorMsg': 'JSON parsing failed',
                'raw_response': response.text,
                'status_code': response.status_code
            }
        
        return parsed_data
            
    except requests.exceptions.Timeout:
        log(f"❌ 요청 타임아웃: {endpoint}")
        return {'result': 'error', 'errorMsg': 'Request timeout'}
    except requests.exceptions.ConnectionError:
        log(f"❌ 연결 에러: {endpoint}")
        return {'result': 'error', 'errorMsg': 'Connection error'}
    except Exception as e:
        log(f"❌ 요청 에러: {e}")
        return {'result': 'error', 'errorMsg': str(e)}

def test_supported_currencies():
    """🔍 지원 화폐 확인"""
    log("🔍 지원 화폐 목록 확인")
    
    url = f'{API_BASE}/ticker/?currency=all'
    try:
        response = requests.get(url, timeout=10)
        data = response.json()
        
        if data.get('result') == 'success':
            currencies = [key for key in data.keys() 
                         if key not in ['result', 'errorCode', 'timestamp']]
            log(f"✅ 지원 화폐: {currencies}")
            
            if CURRENCY.lower() in [c.lower() for c in currencies]:
                log(f"✅ {CURRENCY}는 지원됨")
                return True
            else:
                log(f"❌ {CURRENCY}는 지원되지 않음!")
                log(f"   사용 가능: {currencies}")
                return False
        else:
            log(f"❌ 화폐 목록 조회 실패: {data}")
            return False
    except Exception as e:
        log(f"❌ 화폐 목록 조회 에러: {e}")
        return False

def get_account_balance_debug():
    """🔍 잔고 조회 디버깅"""
    log("💰 계정 잔고 상세 조회")
    
    result = send_request_debug('/v2/account/balance', {})
    
    if result.get('result') == 'success':
        log("✅ 잔고 조회 성공:")
        
        # KRW 잔고
        krw_data = result.get('krw', {})
        krw_avail = float(krw_data.get('avail', '0'))
        krw_balance = float(krw_data.get('balance', '0'))
        log(f"   KRW - 사용가능: {krw_avail:,.0f}원, 총잔고: {krw_balance:,.0f}원")
        
        # 코인 잔고
        coin_key = CURRENCY.lower()
        coin_data = result.get(coin_key, {})
        if coin_data:
            coin_avail = float(coin_data.get('avail', '0'))
            coin_balance = float(coin_data.get('balance', '0'))
            log(f"   {CURRENCY} - 사용가능: {coin_avail:.8f}, 총잔고: {coin_balance:.8f}")
            return coin_avail
        else:
            log(f"   ❌ {CURRENCY} 잔고 정보 없음")
            return 0
    else:
        log(f"❌ 잔고 조회 실패: {result}")
        return 0

def test_market_sell_debug(test_qty=None):
    """🔍 시장가 매도 테스트"""
    log("🚨 시장가 매도 테스트 시작")
    
    # 실제 잔고 확인
    actual_balance = get_account_balance_debug()
    
    if actual_balance <= 0.0001:
        log("❌ 매도할 코인 잔고 없음")
        return False
    
    # 테스트 수량 결정
    if test_qty is None:
        test_qty = min(actual_balance, 0.001)  # 최대 0.001개만 테스트
    
    qty_formatted = f"{test_qty:.8f}"
    
    log(f"🧪 테스트 매도 실행:")
    log(f"   수량: {qty_formatted} {CURRENCY}")
    log(f"   실제 잔고: {actual_balance:.8f}")
    
    # 🔥 시장가 매도 API 호출
    result = send_request_debug('/v2/order/market_sell', {
        'qty': qty_formatted,
        'currency': CURRENCY
    })
    
    log(f"📊 매도 결과 분석:")
    
    if result.get('result') == 'success':
        log("🎉 시장가 매도 성공!")
        order_id = result.get('orderId', 'Unknown')
        log(f"   주문 ID: {order_id}")
        return True
    else:
        error_code = result.get('errorCode', 'Unknown')
        error_msg = result.get('errorMsg', 'No message')
        log(f"❌ 시장가 매도 실패:")
        log(f"   에러 코드: {error_code}")
        log(f"   에러 메시지: {error_msg}")
        
        # 공통 에러 패턴 분석
        if 'insufficient' in error_msg.lower():
            log("   💡 분석: 잔고 부족 에러")
        elif 'minimum' in error_msg.lower():
            log("   💡 분석: 최소 주문 수량 미달")
        elif 'currency' in error_msg.lower():
            log("   💡 분석: 화폐 코드 문제")
        elif 'permission' in error_msg.lower():
            log("   💡 분석: API 권한 문제")
        
        return False

def test_limit_sell_fallback(test_qty):
    """🔍 지정가 매도 대안 테스트"""
    log("🔄 지정가 매도 대안 테스트")
    
    # 현재가 조회
    current_price = get_price()
    if not current_price:
        log("❌ 현재가 조회 실패")
        return False
    
    # 현재가보다 1% 낮은 가격으로 빠른 체결 유도
    sell_price = int(current_price * 0.99)
    qty_formatted = f"{test_qty:.8f}"
    
    log(f"🔄 지정가 매도 시도:")
    log(f"   수량: {qty_formatted} {CURRENCY}")
    log(f"   가격: {sell_price:,}원 (현재가 대비 -1%)")
    
    result = send_request_debug('/v2/order/limit_sell', {
        'price': str(sell_price),
        'qty': qty_formatted,
        'currency': CURRENCY
    })
    
    if result.get('result') == 'success':
        log("✅ 지정가 매도 성공!")
        return True
    else:
        log(f"❌ 지정가 매도도 실패: {result.get('errorMsg', 'Unknown')}")
        return False

def comprehensive_sell_test():
    """🔍 종합 매도 테스트"""
    log("🧪 === 종합 매도 테스트 시작 ===")
    
    # 1. 지원 화폐 확인
    if not test_supported_currencies():
        log("🛑 지원되지 않는 화폐로 인해 테스트 중단")
        return
    
    # 2. 잔고 확인
    balance = get_account_balance_debug()
    if balance <= 0:
        log("🛑 매도할 잔고가 없어서 테스트 불가")
        return
    
    # 3. 시장가 매도 테스트
    test_qty = min(balance * 0.1, 0.001)  # 잔고의 10% 또는 0.001개 중 작은 값
    
    log(f"💡 테스트 수량: {test_qty:.8f} {CURRENCY}")
    
    market_sell_success = test_market_sell_debug(test_qty)
    
    if not market_sell_success:
        log("🔄 시장가 실패 → 지정가 대안 테스트")
        limit_sell_success = test_limit_sell_fallback(test_qty)
        
        if limit_sell_success:
            log("💡 결론: 시장가는 안되지만 지정가는 됨")
        else:
            log("💡 결론: 매도 자체에 문제 있음")
    else:
        log("💡 결론: 시장가 매도 정상 동작")
    
    log("🧪 === 종합 매도 테스트 완료 ===")

def place_immediate_market_sell_fixed():
    """🔥 수정된 시장가 매도"""
    log("🚨 수정된 시장가 매도 시작")
    
    # 1. 잔고 조회
    balance_result = send_request_debug('/v2/account/balance', {})
    if balance_result.get('result') != 'success':
        log("❌ 잔고 조회 실패")
        return False
    
    # 2. 코인 잔고 확인
    coin_balance = float(balance_result.get(CURRENCY.lower(), {}).get('avail', '0'))
    log(f"💰 현재 {CURRENCY} 잔고: {coin_balance:.8f}")
    
    if coin_balance <= 0.0001:
        log("⚠️ 매도할 코인 잔고 없음")
        return False
    
    # 3. 수량 포맷팅 (최대 8자리)
    qty_formatted = f"{coin_balance:.8f}"
    log(f"📊 매도 수량: {qty_formatted} {CURRENCY}")
    
    # 4. 시장가 매도 시도
    result = send_request_debug('/v2/order/market_sell', {
        'qty': qty_formatted,
        'currency': CURRENCY
    })
    
    if result.get('result') == 'success':
        log("🎉 시장가 매도 성공!")
        return True
    else:
        error_msg = result.get('errorMsg', 'Unknown error')
        log(f"❌ 시장가 매도 실패: {error_msg}")
        
        # 5. 대안: 지정가 매도
        log("🔄 지정가 매도 대안 시도")
        return place_backup_limit_sell_fixed(coin_balance)

def place_backup_limit_sell_fixed(qty):
    """🔥 수정된 백업 지정가 매도"""
    current_price = get_price()
    if not current_price:
        log("❌ 현재가 조회 실패")
        return False
    
    # 현재가보다 2% 낮은 가격 (빠른 체결)
    sell_price = int(current_price * 0.98)
    qty_formatted = f"{qty:.8f}"
    
    log(f"🔄 백업 지정가 매도: {qty_formatted} @ {sell_price:,}원")
    
    result = send_request_debug('/v2/order/limit_sell', {
        'price': str(sell_price),
        'qty': qty_formatted,
        'currency': CURRENCY
    })
    
    return result.get('result') == 'success'

if __name__ == '__main__':
    log("🔍 시장가 매도 문제 진단 시작")
    log(f"현재 설정 화폐: {CURRENCY}")
    
    # 종합 테스트 실행
    comprehensive_sell_test()