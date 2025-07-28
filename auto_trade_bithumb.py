"""
빗썸 개선된 메이커봇 (pybithumb 기반)
지속적 주문 관리 및 가격 추종 전략
+ test.py의 정밀 주문취소 로직 적용

핵심 전략:
- 매수: 최유리 매도가 - 1호가
- 매도: 최유리 매수가 + 1호가  
- 지속적 주문: 잔고 있으면 계속 주문
- 선별적 취소: 불리한 주문만 취소, 유리한 주문은 유지
- 실제 거래소 주문 상태 추적
- 정밀 주문 취소: 타입과 심볼 정보 포함한 다중 방법 시도

설치:
pip install pybithumb
"""

import pybithumb
import time
from datetime import datetime
import math


class ImprovedBithumbBot:
    """개선된 pybithumb 기반 메이커봇 - 정밀 주문 취소"""
    
    def __init__(self, connect_key: str, secret_key: str, target_coin: str):
        # pybithumb 인스턴스 생성
        self.bithumb = pybithumb.Bithumb(connect_key, secret_key)
        
        # 거래 설정
        self.target_coin = target_coin.upper()
        self.buy_unit_krw = 5100  # 매수 단위 (원)
        self.min_order_value = 5100  # 최소 주문 금액 (원)
        self.loop_delay = 4  # 루프 딜레이 (초)
        self.order_delay = 0.1  # 주문 간 딜레이 (초)
        
        # 가격 추적
        self.last_buy_price = None    # 마지막 매수 가격
        self.last_sell_price = None   # 마지막 매도 가격
        
        # 잔고 추적 (체결 감지용)
        self.last_krw_balance = 0
        self.last_coin_balance = 0
        
        # 통계
        self.stats = {
            'total_loops': 0,
            'buy_attempts': 0,
            'sell_attempts': 0,
            'buy_successes': 0,
            'sell_successes': 0,
            'cancel_attempts': 0,
            'cancel_successes': 0,
            'precise_cancel_attempts': 0,
            'precise_cancel_successes': 0,
            'start_time': datetime.now()
        }
        
        print(f"🚀 개선된 빗썸 메이커봇 초기화 완료 (정밀 취소 적용)")
        print(f"📋 설정: {self.target_coin} | 매수단위: {self.buy_unit_krw:,}원 | 딜레이: {self.loop_delay}초")
    
    def calculate_tick_size(self, price: float) -> float:
        """호가 단위 계산 (빗썸 호가 단위 규칙 기반)"""
        try:
            if price < 1:
                return 0.0001  # 1원 미만: 0.0001원
            elif price < 10:
                return 0.001   # 1-10원: 0.001원
            elif price < 100:
                return 0.01    # 10-100원: 0.01원
            elif price < 1000:
                return 0.1     # 100-1000원: 0.1원
            elif price < 10000:
                return 1       # 1000-10000원: 1원
            elif price < 100000:
                return 5       # 10000-100000원: 5원
            elif price < 500000:
                return 10      # 100000-500000원: 10원
            elif price < 1000000:
                return 50      # 500000-1000000원: 50원
            elif price < 2000000:
                return 100     # 1000000-2000000원: 100원
            else:
                return 500     # 2000000원 이상: 500원
        except:
            return 0.0001  # 기본값
    
    def get_current_price(self) -> float:
        """현재가 조회"""
        try:
            price = pybithumb.Bithumb.get_current_price(self.target_coin)
            return float(price) if price else None
        except Exception as e:
            print(f"❌ 시세 조회 오류: {str(e)}")
            return None
    
    def get_orderbook(self) -> dict:
        """호가창 정보 조회"""
        try:
            orderbook = pybithumb.Bithumb.get_orderbook(self.target_coin, limit=5)
            if orderbook:
                return orderbook
            return None
        except Exception as e:
            print(f"❌ 호가창 조회 오류: {str(e)}")
            return None
    
    def get_balances(self) -> tuple:
        """잔고 조회 (원화, 대상코인) - 주문 가능 금액과 전체 금액 모두 반환"""
        try:
            # BTC 조회로 원화 잔고 확인 (pybithumb 특성상)
            btc_data = self.bithumb.get_balance("BTC")
            
            if isinstance(btc_data, dict) and 'status' in btc_data:
                error_code = btc_data.get('status')
                error_msg = btc_data.get('message', '')
                
                if error_code == '5302' and 'Access IP' in error_msg:
                    print(f"❌ IP 접근 제한 에러!")
                    print(f"🌐 현재 IP로 추정: {error_msg}")
                    print("\n🔧 해결방법:")
                    print("   1. 빗썸 마이페이지 > API관리 > IP접근제한 '사용안함'")
                    print("   2. 또는 위 IP를 허용 목록에 추가")
                    print("   3. 핫스팟 사용중이면 IP가 자주 바뀜 → '사용안함' 권장")
                    return 0, 0, 0, 0
                else:
                    print(f"❌ 계좌 접근 에러: {btc_data}")
                    return 0, 0, 0, 0
            elif isinstance(btc_data, (list, tuple)) and len(btc_data) >= 4:
                # pybithumb 응답 형식: (코인 보유량, 코인 사용중, 원화 잔고, 원화 사용중)
                krw_total = float(btc_data[2])      # 총 원화
                krw_in_use = float(btc_data[3])     # 사용중 원화
                krw_available = krw_total - krw_in_use  # 실제 사용가능 원화
            else:
                krw_total = 0
                krw_available = 0
            
            # 대상 코인 잔고 조회  
            coin_data = self.bithumb.get_balance(self.target_coin)
            
            if isinstance(coin_data, dict) and 'status' in coin_data:
                coin_total = 0
                coin_available = 0
            elif isinstance(coin_data, (list, tuple)) and len(coin_data) >= 2:
                coin_total = float(coin_data[0])      # 총 보유량
                coin_in_use = float(coin_data[1])     # 사용중 (주문 중)
                coin_available = coin_total - coin_in_use  # 실제 사용가능
            else:
                coin_total = 0
                coin_available = 0
            
            return krw_available, coin_available, krw_total, coin_total
            
        except Exception as e:
            print(f"❌ 잔고 조회 오류: {str(e)}")
            return 0, 0, 0, 0
    
    def get_current_orders(self) -> tuple:
        """현재 제출된 모든 주문 조회 (주문 ID + 가격 + 타입) - 로그 간소화"""
        try:
            orders = self.bithumb.api.orders(order_currency=self.target_coin, 
                                           payment_currency="KRW", 
                                           count=100)
            
            buy_orders = []
            sell_orders = []
            
            if orders and isinstance(orders, dict) and orders.get('status') == '0000':
                order_data = orders.get('data', [])
                if isinstance(order_data, list):
                    for order in order_data:
                        try:
                            remaining_str = str(order.get('units_remaining', '0')).replace(',', '')
                            remaining = float(remaining_str)
                            
                            if remaining > 0:
                                price_str = str(order.get('price', '0')).replace(',', '')
                                price = float(price_str)
                                
                                order_info = {
                                    'order_id': order['order_id'],
                                    'price': price,
                                    'quantity': remaining,
                                    'type': order['type']
                                }
                                
                                if order['type'] == 'bid':
                                    buy_orders.append(order_info)
                                elif order['type'] == 'ask':
                                    sell_orders.append(order_info)
                        except (ValueError, KeyError):
                            continue
            
            return buy_orders, sell_orders
            
        except Exception as e:
            return [], []
    
    def detect_filled_orders(self, krw_total: float, coin_total: float):
        """전체 잔고 변화를 통한 체결 감지 - 로그 간소화"""
        
        # 첫 실행시 잔고 초기화
        if self.stats['total_loops'] == 1:
            self.last_krw_balance = krw_total
            self.last_coin_balance = coin_total
            return
        
        krw_change = krw_total - self.last_krw_balance
        coin_change = coin_total - self.last_coin_balance
        
        # 체결 감지 (로그 간소화)
        if krw_change < -1000 and coin_change > 0.01:
            print(f"💰 매수체결 | 원화 {krw_change:+,.0f} | {self.target_coin} {coin_change:+.4f}")
        elif coin_change < -0.01 and krw_change > 1000:
            print(f"💰 매도체결 | 원화 {krw_change:+,.0f} | {self.target_coin} {coin_change:+.4f}")
        
        # 잔고 업데이트
        self.last_krw_balance = krw_total
        self.last_coin_balance = coin_total
    
    def cancel_order_precise(self, order_id: str, order_type: str) -> bool:
        """정밀 주문 취소 - test.py 로직 적용 (로그 간소화)"""
        try:
            self.stats['precise_cancel_attempts'] += 1
            
            # 방법 1: 기본 cancel_order 먼저 시도
            try:
                result = self.bithumb.cancel_order(order_id)
                if isinstance(result, dict):
                    status = result.get('status')
                    if status == '0000':
                        self.stats['precise_cancel_successes'] += 1
                        return True
                elif result:
                    self.stats['precise_cancel_successes'] += 1
                    return True
            except:
                pass
            
            # 방법 2: order_cancel 사용 (타입과 심볼 포함)
            try:
                if hasattr(self.bithumb, 'order_cancel'):
                    result = self.bithumb.order_cancel(order_id, order_type, self.target_coin)
                    if isinstance(result, dict) and result.get('status') == '0000':
                        self.stats['precise_cancel_successes'] += 1
                        return True
            except:
                pass
            
            # 방법 3: api.cancel 직접 호출
            try:
                result = self.bithumb.api.cancel(
                    order_id=order_id, 
                    type=order_type, 
                    order_currency=self.target_coin,
                    payment_currency="KRW"
                )
                if isinstance(result, dict) and result.get('status') == '0000':
                    self.stats['precise_cancel_successes'] += 1
                    return True
            except:
                pass
            
            # 방법 4: 실제 빗썸 API 방식
            try:
                if hasattr(self.bithumb.api, 'cancel_order'):
                    result = self.bithumb.api.cancel_order(
                        order_id=order_id,
                        order_currency=self.target_coin,
                        payment_currency="KRW",
                        type=order_type
                    )
                    if isinstance(result, dict) and result.get('status') == '0000':
                        self.stats['precise_cancel_successes'] += 1
                        return True
            except:
                pass
            
            # 방법 5: 간단한 파라미터로 시도
            try:
                if hasattr(self.bithumb.api, 'order_cancel'):
                    result = self.bithumb.api.order_cancel(order_id)
                    if isinstance(result, dict) and result.get('status') == '0000':
                        self.stats['precise_cancel_successes'] += 1
                        return True
            except:
                pass
            
            return False
            
        except Exception as e:
            return False
    
    def review_and_cancel_orders(self, current_buy_orders: list, current_sell_orders: list, 
                                target_buy_price: float, target_sell_price: float,
                                current_best_bid: float, current_best_ask: float):
        """기존 주문 검토 및 선별적 취소 - 개선된 조건"""
        
        # 기존 매수주문 검토
        buy_orders_to_cancel = []
        for order in current_buy_orders:
            order_price = order['price']
            # 취소 조건: 1) 기존가 < 목표가 AND 2) 기존가가 현재 최유리 매수가가 아님
            if order_price < target_buy_price and order_price != current_best_bid:
                buy_orders_to_cancel.append(order)
        
        # 기존 매도주문 검토  
        sell_orders_to_cancel = []
        for order in current_sell_orders:
            order_price = order['price']
            # 취소 조건: 1) 기존가 > 목표가 AND 2) 기존가가 현재 최유리 매도가가 아님
            if order_price > target_sell_price and order_price != current_best_ask:
                sell_orders_to_cancel.append(order)
        
        # 선별적 취소 실행
        canceled_buy_count = 0
        canceled_sell_count = 0
        
        # 매수주문 취소
        for order in buy_orders_to_cancel:
            self.stats['cancel_attempts'] += 1
            success = self.cancel_order_precise(order['order_id'], order['type'])
            if success:
                canceled_buy_count += 1
                self.stats['cancel_successes'] += 1
            time.sleep(0.1)
        
        # 매도주문 취소
        for order in sell_orders_to_cancel:
            self.stats['cancel_attempts'] += 1
            success = self.cancel_order_precise(order['order_id'], order['type'])
            if success:
                canceled_sell_count += 1
                self.stats['cancel_successes'] += 1
            time.sleep(0.1)
        
        return canceled_buy_count > 0 or canceled_sell_count > 0
    
    def place_buy_order(self, price: float, quantity: float) -> bool:
        """매수 주문 제출 - 로그 간소화"""
        try:
            tick_size = self.calculate_tick_size(price)
            normalized_price = round(price / tick_size) * tick_size
            normalized_quantity = round(quantity, 4)
            
            result = self.bithumb.buy_limit_order(self.target_coin, normalized_price, normalized_quantity)
            
            if isinstance(result, dict):
                status = result.get('status')
                if status == '0000':
                    order_id = result.get('order_id')
                    if order_id:
                        return True
                return False
            elif isinstance(result, (list, tuple)):
                order_id = result[2] if len(result) > 2 else None
                return bool(order_id)
            else:
                return False
                
        except Exception as e:
            return False

    def place_sell_order(self, price: float, quantity: float) -> bool:
        """매도 주문 제출 - 로그 간소화"""
        try:
            tick_size = self.calculate_tick_size(price)
            normalized_price = round(price / tick_size) * tick_size
            normalized_quantity = round(quantity, 4)
            
            result = self.bithumb.sell_limit_order(self.target_coin, normalized_price, normalized_quantity)
            
            if isinstance(result, dict):
                status = result.get('status')
                if status == '0000':
                    order_id = result.get('order_id')
                    if order_id:
                        return True
                return False
            elif isinstance(result, (list, tuple)):
                order_id = result[2] if len(result) > 2 else None
                return bool(order_id)
            else:
                return False
                
        except Exception as e:
            return False
    
    def calculate_buy_quantity(self, price: float) -> float:
        """매수 수량 계산 - 로그 간소화"""
        tick_size = self.calculate_tick_size(price)
        normalized_price = round(price / tick_size) * tick_size
        quantity = self.buy_unit_krw / normalized_price
        quantity = math.floor(quantity * 10000) / 10000
        return quantity
    
    def calculate_min_sell_quantity(self, price: float) -> float:
        """최소 매도 수량 계산 - 로그 간소화"""
        tick_size = self.calculate_tick_size(price)
        normalized_price = round(price / tick_size) * tick_size
        quantity = self.min_order_value / normalized_price
        quantity = math.floor(quantity * 10000) / 10000
        return quantity
    
    def manage_buy_orders(self, krw_available: float, target_buy_price: float, remaining_buy_orders: int):
        """매수 주문 가능 수량 확인 및 신규 주문 - 로그 간소화"""
        available_krw = krw_available * 0.999
        max_buy_orders = int(available_krw // self.buy_unit_krw)
        
        if max_buy_orders > remaining_buy_orders:
            orders_needed = max_buy_orders - remaining_buy_orders
            buy_quantity = self.calculate_buy_quantity(target_buy_price)
            
            if buy_quantity > 0:
                for i in range(orders_needed):
                    self.stats['buy_attempts'] += 1
                    success = self.place_buy_order(target_buy_price, buy_quantity)
                    if success:
                        self.stats['buy_successes'] += 1
                    else:
                        break
                    time.sleep(self.order_delay)

    def manage_sell_orders(self, coin_available: float, target_sell_price: float, remaining_sell_orders: int):
        """매도 주문 가능 수량 확인 및 신규 주문 - 로그 간소화"""
        if coin_available <= 0:
            return
            
        min_sell_quantity = self.calculate_min_sell_quantity(target_sell_price)
        
        if coin_available >= min_sell_quantity:
            max_sell_orders = int(coin_available // min_sell_quantity)
            
            if max_sell_orders > remaining_sell_orders:
                orders_needed = max_sell_orders - remaining_sell_orders
                
                for i in range(orders_needed):
                    self.stats['sell_attempts'] += 1
                    success = self.place_sell_order(target_sell_price, min_sell_quantity)
                    if success:
                        self.stats['sell_successes'] += 1
                    time.sleep(self.order_delay)
        else:
            if remaining_sell_orders == 0:
                estimated_value = coin_available * target_sell_price
                if estimated_value >= 5000:
                    self.stats['sell_attempts'] += 1
                    success = self.place_sell_order(target_sell_price, coin_available)
                    if success:
                        self.stats['sell_successes'] += 1
    
    def print_stats(self):
        """통계 출력 - 정밀 취소 통계 추가"""
        runtime = datetime.now() - self.stats['start_time']
        
        print(f"\n📊 봇 통계 (실행시간: {runtime})")
        print(f"   총 루프: {self.stats['total_loops']}")
        print(f"   매수 시도: {self.stats['buy_attempts']} | 성공: {self.stats['buy_successes']}")
        print(f"   매도 시도: {self.stats['sell_attempts']} | 성공: {self.stats['sell_successes']}")
        print(f"   취소 시도: {self.stats['cancel_attempts']} | 성공: {self.stats['cancel_successes']}")
        print(f"   정밀취소 시도: {self.stats['precise_cancel_attempts']} | 성공: {self.stats['precise_cancel_successes']}")
        
        total_orders = self.stats['buy_successes'] + self.stats['sell_successes']
        print(f"   총 체결: {total_orders}회")
        
        # 취소 성공률 계산
        if self.stats['cancel_attempts'] > 0:
            cancel_rate = (self.stats['cancel_successes'] / self.stats['cancel_attempts']) * 100
            print(f"   취소 성공률: {cancel_rate:.1f}%")
        
        if self.stats['precise_cancel_attempts'] > 0:
            precise_cancel_rate = (self.stats['precise_cancel_successes'] / self.stats['precise_cancel_attempts']) * 100
            print(f"   정밀취소 성공률: {precise_cancel_rate:.1f}%")
        
        if runtime.total_seconds() > 0:
            orders_per_hour = total_orders / (runtime.total_seconds() / 3600)
            print(f"   시간당 체결: {orders_per_hour:.1f}회")
    
    def run(self):
        """메인 실행 루프 - 선별적 주문 관리 + 정밀 취소"""
        print(f"\n🎯 {self.target_coin} 개선된 메이커봇 시작! (정밀 취소 적용)")
        print("=" * 60)
        
        try:
            while True:
                self.stats['total_loops'] += 1
                
                # 1. 실시간 데이터 수집
                current_price = self.get_current_price()
                if not current_price:
                    print("❌ 시세 조회 실패, 재시도...")
                    time.sleep(self.loop_delay)
                    continue
                
                # 호가창 정보 조회
                orderbook = self.get_orderbook()
                if not orderbook:
                    print("❌ 호가창 조회 실패, 재시도...")
                    time.sleep(self.loop_delay)
                    continue
                    
                bids = orderbook.get('bids', [])
                asks = orderbook.get('asks', [])
                
                if not bids or not asks:
                    print("❌ 호가 데이터 없음, 재시도...")
                    time.sleep(self.loop_delay)
                    continue
                
                # 최유리 가격 추출
                current_best_bid = float(bids[0]['price'])  # 현재 최유리 매수가
                current_best_ask = float(asks[0]['price'])  # 현재 최유리 매도가
                tick_size = self.calculate_tick_size(current_best_bid)
                
                # 2. 목표 가격 계산
                buy_option1 = current_best_bid + tick_size  # 최유리매수가 + 1호가
                buy_option2 = current_best_ask - tick_size  # 최유리매도가 - 1호가
                target_buy_price = min(buy_option1, buy_option2)
                target_buy_price = round(target_buy_price / tick_size) * tick_size  # 호가 단위로 정규화
                
                sell_option1 = current_best_ask - tick_size  # 최유리매도가 - 1호가
                sell_option2 = current_best_bid + tick_size  # 최유리매수가 + 1호가
                target_sell_price = max(sell_option1, sell_option2)
                target_sell_price = round(target_sell_price / tick_size) * tick_size  # 호가 단위로 정규화
                
                # 잔고 조회
                krw_available, coin_available, krw_total, coin_total = self.get_balances()
                
                # 현재 제출된 모든 주문 조회 (주문 ID + 가격 + 타입)
                current_buy_orders, current_sell_orders = self.get_current_orders()
                
                print(f"\n🔄 Loop #{self.stats['total_loops']}")
                print(f"   현재가: {current_price}원")
                print(f"   잔고: 원화 {krw_available:,.0f}원(총{krw_total:,.0f}) | {self.target_coin} {coin_available:.4f}(총{coin_total:.4f})")
                print(f"   최유리: 매수 {current_best_bid}원 | 매도 {current_best_ask}원 | 호가단위 {tick_size}원")
                print(f"   목표가: 매수 {target_buy_price}원 | 매도 {target_sell_price}원")
                print(f"   실제주문: 매수 {len(current_buy_orders)}개 | 매도 {len(current_sell_orders)}개")
                
                # 체결 감지
                self.detect_filled_orders(krw_total, coin_total)
                
                # 기존 주문 검토 및 선별적 취소 (개선된 조건 + 최유리가격 파라미터 추가)
                orders_canceled = self.review_and_cancel_orders(
                    current_buy_orders, current_sell_orders, 
                    target_buy_price, target_sell_price,
                    current_best_bid, current_best_ask
                )
                
                # 취소가 발생했다면 최신 주문 상태 다시 조회
                if orders_canceled:
                    time.sleep(0.5)
                    current_buy_orders, current_sell_orders = self.get_current_orders()
                
                # 주문 관리
                remaining_buy_orders = len(current_buy_orders)
                remaining_sell_orders = len(current_sell_orders)
                
                self.manage_buy_orders(krw_available, target_buy_price, remaining_buy_orders)
                self.manage_sell_orders(coin_available, target_sell_price, remaining_sell_orders)

                # 가격 업데이트
                self.last_buy_price = target_buy_price
                self.last_sell_price = target_sell_price

                # # 간소화된 로그 출력
                # print(f"Loop #{self.stats['total_loops']} | 현재가: {current_price}원 | "
                #       f"잔고: ₩{krw_available:,.0f} {self.target_coin} {coin_available:.4f} | "
                #       f"주문: 매수{len(current_buy_orders)}개 매도{len(current_sell_orders)}개 | "
                #       f"목표: 매수{target_buy_price}원 매도{target_sell_price}원")

                # 통계 출력 (100루프마다)
                if self.stats['total_loops'] % 100 == 0:
                    self.print_stats()

                # 딜레이
                time.sleep(self.loop_delay)
                
        except KeyboardInterrupt:
            print(f"\n🛑 봇 중지 요청 감지")
            self.print_stats()
            print("봇이 안전하게 종료되었습니다.")
        
        except Exception as e:
            print(f"\n💥 예상치 못한 오류: {str(e)}")
            self.print_stats()


def check_current_ip():
    """현재 IP 주소 확인"""
    try:
        import requests
        response = requests.get('https://api.ipify.org?format=json', timeout=5)
        ip_info = response.json()
        current_ip = ip_info['ip']
        print(f"🌐 현재 IP 주소: {current_ip}")
        return current_ip
    except Exception as e:
        print(f"❌ IP 확인 실패: {e}")
        print("💡 수동 확인: https://www.whatismyip.com/ 접속")
        return None

def main():
    """메인 실행 함수"""
    print("🚀 개선된 빗썸 메이커봇 (정밀 주문 취소 적용)")
    print("=" * 60)
    
    # 현재 IP 확인
    print("\n🔍 네트워크 상태 확인...")
    current_ip = check_current_ip()
    
    # ========================================
    # 🎯 거래 설정 (여기서만 변경하면 됩니다!)
    # ========================================
    TARGET_COIN = "NEIRO"  # 거래할 코인명 (대문자로 입력)
    
    # API 키 입력 (실제 사용시 본인의 API 키로 변경)
    CONNECT_KEY = "7358f77f2ecf9f905e435ee1961980b0"  # Connect Key
    SECRET_KEY = "498483e0e34a7c2703f57dd311f37444"    # Secret Key
    # ========================================
    
    if CONNECT_KEY == "YOUR_CONNECT_KEY_HERE" or SECRET_KEY == "YOUR_SECRET_KEY_HERE":
        print("❌ API 키를 설정해주세요!")
        print("코드에서 CONNECT_KEY와 SECRET_KEY 변수를 본인의 키로 변경하세요.")
        return
    
    print("\n📦 pybithumb 라이브러리 확인 중...")
    try:
        import pybithumb
        print("✅ pybithumb 라이브러리 확인 완료")
        print(f"📋 pybithumb 버전: {pybithumb.__version__ if hasattr(pybithumb, '__version__') else '확인불가'}")
    except ImportError:
        print("❌ pybithumb가 설치되지 않았습니다!")
        print("다음 명령어로 설치하세요: pip install pybithumb")
        return
    
    # 봇 생성
    bot = ImprovedBithumbBot(CONNECT_KEY, SECRET_KEY, TARGET_COIN)
    
    print("\n⚠️ 주의사항:")
    print("- 실제 거래가 실행됩니다 (테스트가 아님)")
    print("- 선별적 주문 전략: 유리한 주문은 유지, 불리한 주문만 취소")
    print("- 정밀 주문 취소: 5가지 방법으로 취소 시도")
    print("- 가격 변동시 즉시 주문 취소 후 재주문")
    print("- 실제 거래소 주문 상태를 추적합니다")
    print("- 충분한 원화 잔고를 준비하세요 (최소 10,000원 이상 권장)")
    print("- Ctrl+C로 안전하게 종료할 수 있습니다")
    
    # API 연결 테스트
    print(f"\n🔍 API 연결 테스트 중... (대상: {TARGET_COIN})")
    
    # 1. 시세 조회 테스트 (공개 API - IP 제한 없음)
    current_price = bot.get_current_price()
    if current_price:
        print(f"✅ 시세 조회 성공! {TARGET_COIN} 현재가: {current_price}원")
    else:
        print("❌ 시세 조회 실패!")
        return
    
    # 2. 잔고 조회 테스트 (개인 API - IP 제한 있음)
    try:
        krw_available, coin_available, krw_total, coin_total = bot.get_balances()
        
        if krw_total == 0 and coin_total == 0:
            print("⚠️ 잔고 조회 실패 - IP 접근 제한 문제로 추정")
            print("📋 해결 후 다시 실행하거나, 일단 시세 조회만으로 테스트 진행 가능")
            
            # 사용자 선택
            choice = input("\n계속 진행하시겠습니까? (y/n): ").lower()
            if choice != 'y':
                print("프로그램을 종료합니다.")
                return
        else:
            print(f"✅ 계좌 정보 조회 성공!")
            print(f"   원화 잔고: {krw_available:,.0f}원 (총 {krw_total:,.0f}원)")
            print(f"   {TARGET_COIN} 잔고: {coin_available:.4f} (총 {coin_total:.4f})")
        
    except Exception as e:
        print(f"❌ 계좌 정보 조회 실패: {str(e)}")
        print("\n🔧 해결 방법:")
        print("   1. 빗썸 마이페이지 > API관리")
        print("   2. IP 접근 제한을 '사용 안함'으로 설정")
        print("   3. 또는 현재 IP를 허용 목록에 추가")
        print("   4. API 키 권한 확인 (자산조회, 거래 권한 필요)")
        return
    
    # 3. 호가창 및 최적 가격 테스트
    orderbook = bot.get_orderbook()
    if orderbook:
        bids = orderbook.get('bids', [])
        asks = orderbook.get('asks', [])
        
        if bids and asks:
            current_best_bid = float(bids[0]['price'])
            current_best_ask = float(asks[0]['price'])
            tick_size = bot.calculate_tick_size(current_best_bid)
            
            buy_option1 = current_best_bid + tick_size
            buy_option2 = current_best_ask - tick_size
            target_buy_price = min(buy_option1, buy_option2)
            
            sell_option1 = current_best_ask - tick_size
            sell_option2 = current_best_bid + tick_size
            target_sell_price = max(sell_option1, sell_option2)
            
            print(f"   💡 가격 계산:")
            print(f"      매수 옵션: {buy_option1}원 vs {buy_option2}원 → {target_buy_price}원 선택")
            print(f"      매도 옵션: {sell_option1}원 vs {sell_option2}원 → {target_sell_price}원 선택")
            
            print(f"✅ 호가창 조회 및 가격 계산 성공!")
            print(f"   목표 매수가: {target_buy_price}원")
            print(f"   목표 매도가: {target_sell_price}원")
        else:
            print("❌ 호가 데이터 없음!")
            return
    else:
        print("❌ 호가창 조회 실패!")
        return
    
    # 4. 실제 주문 조회 테스트
    current_buy_orders, current_sell_orders = bot.get_current_orders()
    print(f"✅ 주문 조회 성공!")
    print(f"   현재 매수 주문: {len(current_buy_orders)}개")
    print(f"   현재 매도 주문: {len(current_sell_orders)}개")
    
    if current_buy_orders:
        print("   매수 주문 목록:")
        for order in current_buy_orders:
            print(f"     - {order['quantity']:.4f} @ {order['price']}원 (ID: {order['order_id']}, Type: {order['type']})")
    
    if current_sell_orders:
        print("   매도 주문 목록:")
        for order in current_sell_orders:
            print(f"     - {order['quantity']:.4f} @ {order['price']}원 (ID: {order['order_id']}, Type: {order['type']})")
    
    # 5. 정밀 취소 테스트 (선택사항)
    if current_buy_orders or current_sell_orders:
        test_cancel = input("\n정밀 취소 기능을 테스트하시겠습니까? (y/n): ").lower()
        if test_cancel == 'y':
            if current_buy_orders:
                test_order = current_buy_orders[0]
                print(f"\n🧪 정밀 취소 테스트: 매수주문 {test_order['order_id']}")
                success = bot.cancel_order_precise(test_order['order_id'], test_order['type'])
                if success:
                    print("✅ 정밀 취소 테스트 성공!")
                else:
                    print("❌ 정밀 취소 테스트 실패")
            elif current_sell_orders:
                test_order = current_sell_orders[0]
                print(f"\n🧪 정밀 취소 테스트: 매도주문 {test_order['order_id']}")
                success = bot.cancel_order_precise(test_order['order_id'], test_order['type'])
                if success:
                    print("✅ 정밀 취소 테스트 성공!")
                else:
                    print("❌ 정밀 취소 테스트 실패")
    
    input("\n모든 테스트 완료! 계속하려면 Enter를 누르세요...")
    
    # 봇 실행
    bot.run()


if __name__ == "__main__":
    main()