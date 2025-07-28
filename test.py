import requests

def get_price_unit(symbol="BTC", currency="KRW"):
    """
    빗썸 orders/chance API로 해당 코인의 매수/매도 틱 단위 조회
    반환: {"bid_unit": float, "ask_unit": float}
    """
    url = "https://api.bithumb.com/v1/orderbook/chance"
    params = {
        "order_currency": symbol,
        "payment_currency": currency
    }

    resp = requests.get(url, params=params)
    resp.raise_for_status()
    data = resp.json().get('data', {}).get('market', {})

    bid_unit = float(data.get('bid', {}).get('price_unit', 0))
    ask_unit = float(data.get('ask', {}).get('price_unit', 0))
    return {"bid_unit": bid_unit, "ask_unit": ask_unit}

if __name__ == "__main__":
    # 예시: 여러 코인 조회
    for sym in ["NEIRO", "APT", "BTC", "KRW-PRICE-LOWTEST"]:
        pu = get_price_unit(sym)
        print(f"{sym:6s} → 매수 단위: {pu['bid_unit']}, 매도 단위: {pu['ask_unit']}")
