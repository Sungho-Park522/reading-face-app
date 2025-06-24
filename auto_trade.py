import requests
import time
import hmac
import hashlib
import base64
import uuid
import json
from datetime import datetime

# === 설정 ===
ACCESS_TOKEN = 'ae437cfc-b806-4798-88e7-5954b8745fb7'
SECRET_KEY = '0810c158-7bf7-47f0-97c1-a4c90e85a8e5'
CURRENCY = 'VIRTUAL'
PRICE_RANGE = 0.005  # 0.5%
KRW_AMOUNT = 5000
INTERVAL = 5  # 초

API_BASE = 'https://api.coinone.co.kr'

def get_price():
    url = f'{API_BASE}/ticker/?currency={CURRENCY.lower()}'
    res = requests.get(url)
    return float(res.json()['last'])

def build_headers(payload):
    encoded = base64.b64encode(json.dumps(payload).encode())
    signature = hmac.new(SECRET_KEY.encode(), encoded, hashlib.sha512).hexdigest()
    return {
        'X-COINONE-PAYLOAD': encoded.decode(),
        'X-COINONE-SIGNATURE': signature,
        'Content-Type': 'application/json'
    }

def send_request(endpoint, body):
    payload = {
        'access_token': ACCESS_TOKEN,
        'nonce': int(time.time() * 1000),
        **body
    }
    headers = build_headers(payload)
    r = requests.post(API_BASE + endpoint, headers=headers)
    try:
        return r.json()
    except:
        print("에러: 응답 파싱 실패")
        return {}

def get_open_orders():
    return send_request('/v2/order/limit_orders', {'currency': CURRENCY}).get('limitOrders', [])

def cancel_order(order_id):
    return send_request('/v2/order/cancel', {'order_id': order_id, 'currency': CURRENCY})

def place_limit_order(price, qty, is_buy):
    return send_request('/v2/order/limit_' + ('buy' if is_buy else 'sell'), {
        'price': str(price),
        'qty': f"{qty:.8f}",
        'currency': CURRENCY
    })

def place_market_order(qty, is_buy):
    return send_request('/v2/order/market_' + ('buy' if is_buy else 'sell'), {
        'qty': f"{qty:.8f}",
        'currency': CURRENCY
    })

def get_balance():
    return send_request('/v2/account/balance', {}).get(CURRENCY.lower(), {}).get('avail')

def run():
    print(f"[{datetime.now()}] 코인원 리워드 자동화 시작")
    last_order_id = None

    while True:
        try:
            now = datetime.now()
            price = get_price()
            low = round(price * (1 - PRICE_RANGE))
            high = round(price * (1 + PRICE_RANGE))
            print(f"[{now}] 현재가: {price}, 주문가: {low} ~ {high}")

            # 기존 주문 조회 및 취소
            open_orders = get_open_orders()
            for order in open_orders:
                cancel_order(order['orderId'])

            # 현재가보다 낮은 쪽이면 매수 유지
            order_price = low if price - low < high - price else high
            is_buy = order_price == low
            qty = KRW_AMOUNT / price if is_buy else float(get_balance()) * 0.1

            # 지정가 주문 재등록
            place_limit_order(order_price, qty, is_buy)

            # 체결 감지 및 즉시 시장가 반대 주문
            time.sleep(INTERVAL)
            current_orders = get_open_orders()
            if not current_orders:
                print(f"[{now}] 주문 체결됨! 시장가 반대 포지션 청산")
                qty = float(get_balance()) * 0.1 if not is_buy else KRW_AMOUNT / get_price()
                place_market_order(qty, not is_buy)

        except KeyboardInterrupt:
            print("사용자 종료")
            break
        except Exception as e:
            print("에러:", e)
        time.sleep(INTERVAL)

if __name__ == '__main__':
    run()
