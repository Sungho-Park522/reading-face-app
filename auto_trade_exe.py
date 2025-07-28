"""
빗썸 GUI 자동매매봇 (Tkinter 대시보드) - 웹사이트 기반 암호 인증 포함
실시간 모니터링 + API 키 입력 + 시작/중지 제어 + 웹 기반 라이센스 인증 + 강제 청산

설치:
pip install pybithumb requests beautifulsoup4

실행:
python bithumb_gui_bot.py
"""

import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import threading
import time
from datetime import datetime, timedelta
import math
import pybithumb
import requests
from bs4 import BeautifulSoup


class BithumbGUIBot:
    """GUI 기반 빗썸 자동매매봇 (웹 기반 암호 인증 포함)"""
    
    def __init__(self):
        # GUI 설정
        self.root = tk.Tk()
        self.root.title("빗썸 메이커봇 v2.1")
        self.root.geometry("800x850")
        self.root.resizable(True, True)
        self.root.minsize(600, 500)  # 최소 크기 설정
        
        # 인증 상태
        self.is_authenticated = False
        self.password_input = tk.StringVar()
        
        # 봇 상태
        self.is_running = False
        self.bot_thread = None
        self.bithumb = None
        
        # 봇 설정
        self.target_coin = tk.StringVar(value="NEIRO")
        self.connect_key = tk.StringVar()
        self.secret_key = tk.StringVar()
        self.buy_unit_krw = 5100
        self.min_order_value = 5100
        self.active_loop_delay = tk.DoubleVar(value=2.0)  # 활성 모드 딜레이 (거래 가능시)
        self.idle_loop_delay = tk.DoubleVar(value=5.0)    # 대기 모드 딜레이 (거래 불가시)
        self.order_delay = 0.1
        self.current_mode = "idle"  # "active" 또는 "idle"
        
        # 강제 청산 설정 - 개별 필드로 변경
        self.liquidation_year = tk.StringVar(value="2024")
        self.liquidation_month = tk.StringVar(value="12")
        self.liquidation_day = tk.StringVar(value="31")
        self.liquidation_hour = tk.StringVar(value="23")
        self.liquidation_minute = tk.StringVar(value="50")
        self.enable_liquidation = tk.BooleanVar(value=False)
        self.liquidation_executed = False  # 청산 실행 여부 플래그
        
        # 실시간 데이터
        self.current_price = 0
        self.krw_available = 0
        self.coin_available = 0
        self.krw_total = 0
        self.coin_total = 0
        self.buy_orders_count = 0
        self.sell_orders_count = 0
        self.target_buy_price = 0
        self.target_sell_price = 0
        
        # 통계
        self.stats = {
            'total_loops': 0,
            'buy_attempts': 0,
            'sell_attempts': 0,
            'buy_successes': 0,  # 주문 제출 성공
            'sell_successes': 0,  # 주문 제출 성공
            'buy_filled': 0,  # 실제 매수 체결
            'sell_filled': 0,  # 실제 매도 체결
            'cancel_attempts': 0,
            'cancel_successes': 0,
            'start_time': None
        }
        
        # 체결 감지용 잔고 추적
        self.last_krw_balance = 0
        self.last_coin_balance = 0
        
        self.setup_gui()

    def _on_mousewheel(self, event):
        """마우스 휠 스크롤 처리"""
        try:
            self.canvas.yview_scroll(int(-1*(event.delta/120)), "units")
        except:
            # Linux 시스템 호환성
            if event.num == 4:
                self.canvas.yview_scroll(-1, "units")
            elif event.num == 5:
                self.canvas.yview_scroll(1, "units")

    def get_liquidation_datetime_string(self):
        """개별 필드들을 조합하여 날짜 문자열 생성"""
        try:
            year = self.liquidation_year.get().strip()
            month = self.liquidation_month.get().strip().zfill(2)
            day = self.liquidation_day.get().strip().zfill(2)
            hour = self.liquidation_hour.get().strip().zfill(2)
            minute = self.liquidation_minute.get().strip().zfill(2)
            
            return f"{year}-{month}-{day} {hour}:{minute}"
        except:
            return "2024-12-31 23:50"

    def validate_liquidation_inputs(self):
        """청산 일시 입력값 검증"""
        try:
            year = int(self.liquidation_year.get().strip())
            month = int(self.liquidation_month.get().strip())
            day = int(self.liquidation_day.get().strip())
            hour = int(self.liquidation_hour.get().strip())
            minute = int(self.liquidation_minute.get().strip())
            
            # 범위 검증
            if not (2024 <= year <= 2030):
                return False, "연도는 2024~2030 범위여야 합니다."
            if not (1 <= month <= 12):
                return False, "월은 1~12 범위여야 합니다."
            if not (1 <= day <= 31):
                return False, "일은 1~31 범위여야 합니다."
            if not (0 <= hour <= 23):
                return False, "시간은 0~23 범위여야 합니다."
            if not (0 <= minute <= 59):
                return False, "분은 0~59 범위여야 합니다."
            
            # 날짜 유효성 검증
            test_datetime = datetime(year, month, day, hour, minute)
            
            # 과거 일시 체크
            if test_datetime <= datetime.now():
                return False, "청산 일시는 현재 시간보다 미래여야 합니다."
                
            return True, ""
            
        except ValueError:
            return False, "모든 필드에 숫자를 입력해주세요."
        except Exception as e:
            return False, f"날짜 형식이 올바르지 않습니다: {str(e)}"
        
    def get_web_password(self):
        try:
            url = 'https://blog.naver.com/PostView.naver?blogId=alxnzmeja&logNo=223919447676'
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }

            response = requests.get(url, headers=headers, timeout=10)
            soup = BeautifulSoup(response.text, 'html.parser')

            title_tag = soup.find('title')
            if title_tag:
                title = title_tag.text.strip()
                # ':' 앞에 있는 부분만 추출, 공백 제거
                key = title.split(':')[0].strip().replace(' ', '')
                return key
            else:
                return None
        except Exception:
            return None
    
    def verify_password(self):
        """암호 확인"""
        try:
            entered_password = self.password_input.get().strip()
            if not entered_password:
                messagebox.showerror("오류", "암호를 입력해주세요!")
                return False
            
            # 웹에서 암호 가져오기
            web_password = self.get_web_password()
            # print(web_password)
            if web_password is None:
                messagebox.showerror("연결 오류", "라이센스 서버에 연결할 수 없습니다!\n인터넷 연결을 확인해주세요.")
                return False
            
            # 암호 비교
            if entered_password == web_password:
                self.is_authenticated = True
                messagebox.showinfo("인증 성공", "라이센스 인증이 완료되었습니다!")
                self.enable_main_features()
                self.add_log("🔐 라이센스 인증 성공!")
                return True
            else:
                messagebox.showerror("인증 실패", "잘못된 라이센스 키입니다!")
                return False
                
        except Exception as e:
            messagebox.showerror("오류", f"인증 과정에서 오류가 발생했습니다: {str(e)}")
            return False
    
    def enable_main_features(self):
        """메인 기능들 활성화"""
        # 설정 섹션의 모든 입력 필드 활성화
        for widget in self.settings_frame.winfo_children():
            if isinstance(widget, ttk.Frame):
                for child in widget.winfo_children():
                    if isinstance(child, (ttk.Entry, ttk.Button, ttk.Checkbutton)):
                        child.config(state="normal")
            elif isinstance(widget, ttk.LabelFrame):
                for child in widget.winfo_children():
                    if isinstance(child, (ttk.Entry, ttk.Button, ttk.Checkbutton)):
                        child.config(state="normal")
                    elif isinstance(child, ttk.Frame):
                        for grandchild in child.winfo_children():
                            if isinstance(grandchild, (ttk.Entry, ttk.Button, ttk.Checkbutton)):
                                grandchild.config(state="normal")
            elif isinstance(widget, (ttk.Entry, ttk.Button, ttk.Checkbutton)):
                widget.config(state="normal")
        
        # 시작 버튼 활성화
        self.start_button.config(state="normal")
        
        # 인증 프레임 숨기기
        self.auth_frame.grid_remove()
        
        # 인증 상태 표시
        self.auth_status_label.config(text="🟢 인증됨", foreground="green")
    
    def disable_main_features(self):
        """메인 기능들 비활성화"""
        # 설정 섹션의 모든 입력 필드 비활성화
        for widget in self.settings_frame.winfo_children():
            if isinstance(widget, ttk.Frame):
                for child in widget.winfo_children():
                    if isinstance(child, (ttk.Entry, ttk.Button, ttk.Checkbutton)) and child != self.verify_button:
                        child.config(state="disabled")
            elif isinstance(widget, ttk.LabelFrame):
                for child in widget.winfo_children():
                    if isinstance(child, (ttk.Entry, ttk.Button, ttk.Checkbutton)) and child != self.verify_button:
                        child.config(state="disabled")
                    elif isinstance(child, ttk.Frame):
                        for grandchild in child.winfo_children():
                            if isinstance(grandchild, (ttk.Entry, ttk.Button, ttk.Checkbutton)) and grandchild != self.verify_button:
                                grandchild.config(state="disabled")
            elif isinstance(widget, (ttk.Entry, ttk.Button, ttk.Checkbutton)) and widget != self.verify_button:
                widget.config(state="disabled")
        
        # 시작/중지 버튼 비활성화
        self.start_button.config(state="disabled")
        self.stop_button.config(state="disabled")
        
        # 인증 상태 표시
        self.auth_status_label.config(text="🔴 인증 필요", foreground="red")
    
    def setup_gui(self):
        """GUI 레이아웃 설정"""
        
        # 스크롤 가능한 캔버스 생성
        self.canvas = tk.Canvas(self.root)
        self.scrollbar = ttk.Scrollbar(self.root, orient="vertical", command=self.canvas.yview)
        self.scrollable_frame = ttk.Frame(self.canvas)
        
        # 스크롤 설정
        self.scrollable_frame.bind(
            "<Configure>",
            lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all"))
        )
        
        self.canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")
        self.canvas.configure(yscrollcommand=self.scrollbar.set)
        
        # 캔버스와 스크롤바 배치
        self.canvas.pack(side="left", fill="both", expand=True)
        self.scrollbar.pack(side="right", fill="y")
        
        # 마우스 휠 스크롤 바인딩
        self.canvas.bind("<MouseWheel>", self._on_mousewheel)
        self.root.bind("<MouseWheel>", self._on_mousewheel)
        
        # 메인 프레임 (이제 scrollable_frame 안에)
        main_frame = ttk.Frame(self.scrollable_frame, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # 0. 인증 섹션
        self.auth_frame = ttk.LabelFrame(main_frame, text="🔐 라이센스 인증", padding="10")
        self.auth_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        
        # 인증 상태 표시
        auth_status_frame = ttk.Frame(self.auth_frame)
        auth_status_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        
        self.auth_status_label = ttk.Label(auth_status_frame, text="🔴 인증 필요", 
                                          font=("Arial", 10, "bold"), foreground="red")
        self.auth_status_label.pack(side=tk.LEFT)
        
        # 암호 입력
        ttk.Label(self.auth_frame, text="라이센스 키:").grid(row=1, column=0, sticky=tk.W, padx=(0, 10))
        password_entry = ttk.Entry(self.auth_frame, textvariable=self.password_input, width=20, font=("Arial", 12))
        password_entry.grid(row=1, column=1, sticky=tk.W, padx=(0, 10))
        
        # 인증 버튼
        self.verify_button = ttk.Button(self.auth_frame, text="🔓 인증", command=self.verify_password)
        self.verify_button.grid(row=1, column=2, sticky=tk.W)
        
        # Enter 키로 인증
        password_entry.bind("<Return>", lambda e: self.verify_password())
        
        # 안내 텍스트
        info_label = ttk.Label(self.auth_frame, text="※ 라이센스 키를 입력하고 인증을 완료해야 봇을 사용할 수 있습니다.", 
                              font=("Arial", 9), foreground="gray")
        info_label.grid(row=2, column=0, columnspan=3, sticky=tk.W, pady=(5, 0))
        
        # 1. 설정 섹션
        self.settings_frame = ttk.LabelFrame(main_frame, text="🔧 설정", padding="10")
        self.settings_frame.grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        
        # API 키 입력
        ttk.Label(self.settings_frame, text="Connect Key:").grid(row=0, column=0, sticky=tk.W, padx=(0, 10))
        connect_entry = ttk.Entry(self.settings_frame, textvariable=self.connect_key, width=40, show="*", state="disabled")
        connect_entry.grid(row=0, column=1, sticky=(tk.W, tk.E), padx=(0, 10))
        
        ttk.Label(self.settings_frame, text="Secret Key:").grid(row=1, column=0, sticky=tk.W, padx=(0, 10), pady=(5, 0))
        secret_entry = ttk.Entry(self.settings_frame, textvariable=self.secret_key, width=40, show="*", state="disabled")
        secret_entry.grid(row=1, column=1, sticky=(tk.W, tk.E), padx=(0, 10), pady=(5, 0))
        
        # 코인 선택
        ttk.Label(self.settings_frame, text="대상 코인:").grid(row=2, column=0, sticky=tk.W, padx=(0, 10), pady=(5, 0))
        coin_entry = ttk.Entry(self.settings_frame, textvariable=self.target_coin, width=20, state="disabled")
        coin_entry.grid(row=2, column=1, sticky=tk.W, padx=(0, 10), pady=(5, 0))
        
        # 루프 딜레이 설정
        ttk.Label(self.settings_frame, text="활성 모드 딜레이(초):").grid(row=3, column=0, sticky=tk.W, padx=(0, 10), pady=(5, 0))
        active_delay_entry = ttk.Entry(self.settings_frame, textvariable=self.active_loop_delay, width=10, state="disabled")
        active_delay_entry.grid(row=3, column=1, sticky=tk.W, padx=(0, 10), pady=(5, 0))
        
        ttk.Label(self.settings_frame, text="대기 모드 딜레이(초):").grid(row=4, column=0, sticky=tk.W, padx=(0, 10), pady=(5, 0))
        idle_delay_entry = ttk.Entry(self.settings_frame, textvariable=self.idle_loop_delay, width=10, state="disabled")
        idle_delay_entry.grid(row=4, column=1, sticky=tk.W, padx=(0, 10), pady=(5, 0))
        
        # 강제 청산 설정 - 개선된 버전
        liquidation_frame = ttk.LabelFrame(self.settings_frame, text="⏰ 강제 청산 설정", padding="5")
        liquidation_frame.grid(row=5, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(10, 0))

        # 청산 활성화 체크박스
        liquidation_check = ttk.Checkbutton(liquidation_frame, text="강제 청산 활성화", 
                                        variable=self.enable_liquidation, state="disabled")
        liquidation_check.grid(row=0, column=0, columnspan=6, sticky=tk.W, pady=(0, 10))

        # 청산 일시 입력 - 개별 필드들
        ttk.Label(liquidation_frame, text="청산 일시:").grid(row=1, column=0, sticky=tk.W, padx=(0, 5))

        # 연도
        ttk.Label(liquidation_frame, text="년").grid(row=1, column=1, sticky=tk.W, padx=(5, 2))
        year_entry = ttk.Entry(liquidation_frame, textvariable=self.liquidation_year, width=6, state="disabled")
        year_entry.grid(row=1, column=2, sticky=tk.W, padx=(0, 10))

        # 월
        ttk.Label(liquidation_frame, text="월").grid(row=1, column=3, sticky=tk.W, padx=(0, 2))
        month_entry = ttk.Entry(liquidation_frame, textvariable=self.liquidation_month, width=4, state="disabled")
        month_entry.grid(row=1, column=4, sticky=tk.W, padx=(0, 10))

        # 일
        ttk.Label(liquidation_frame, text="일").grid(row=1, column=5, sticky=tk.W, padx=(0, 2))
        day_entry = ttk.Entry(liquidation_frame, textvariable=self.liquidation_day, width=4, state="disabled")
        day_entry.grid(row=1, column=6, sticky=tk.W, padx=(0, 20))

        # 시간
        ttk.Label(liquidation_frame, text="시").grid(row=1, column=7, sticky=tk.W, padx=(0, 2))
        hour_entry = ttk.Entry(liquidation_frame, textvariable=self.liquidation_hour, width=4, state="disabled")
        hour_entry.grid(row=1, column=8, sticky=tk.W, padx=(0, 10))

        # 분
        ttk.Label(liquidation_frame, text="분").grid(row=1, column=9, sticky=tk.W, padx=(0, 2))
        minute_entry = ttk.Entry(liquidation_frame, textvariable=self.liquidation_minute, width=4, state="disabled")
        minute_entry.grid(row=1, column=10, sticky=tk.W)

        # 안내 텍스트
        liquidation_info = ttk.Label(liquidation_frame, 
                                    text="※ 설정 일시에 모든 주문 취소 후 매수 5호가로 전체 매도하고 봇이 중지됩니다.",
                                    font=("Arial", 8), foreground="gray")
        liquidation_info.grid(row=2, column=0, columnspan=11, sticky=tk.W, pady=(5, 0))
        
        # 제어 버튼
        button_frame = ttk.Frame(self.settings_frame)
        button_frame.grid(row=6, column=0, columnspan=2, pady=(10, 0))
        
        self.start_button = ttk.Button(button_frame, text="🚀 시작", command=self.start_bot, state="disabled")
        self.start_button.pack(side=tk.LEFT, padx=(0, 10))
        
        self.stop_button = ttk.Button(button_frame, text="🛑 중지", command=self.stop_bot, state="disabled")
        self.stop_button.pack(side=tk.LEFT)
        
        # 2. 상태 표시 섹션
        status_frame = ttk.LabelFrame(main_frame, text="📊 실시간 상태", padding="10")
        status_frame.grid(row=2, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        
        # 상태 레이블들
        self.status_label = ttk.Label(status_frame, text="🔴 중지됨", font=("Arial", 12, "bold"))
        self.status_label.grid(row=0, column=0, columnspan=2, sticky=tk.W, pady=(0, 5))
        
        self.mode_label = ttk.Label(status_frame, text="모드: 대기중", font=("Arial", 10))
        self.mode_label.grid(row=1, column=0, columnspan=2, sticky=tk.W, pady=(0, 10))
        
        # 잔고 정보
        balance_frame = ttk.Frame(status_frame)
        balance_frame.grid(row=2, column=0, sticky=(tk.W, tk.E), padx=(0, 20))
        
        ttk.Label(balance_frame, text="💰 잔고", font=("Arial", 10, "bold")).pack(anchor=tk.W)
        self.krw_label = ttk.Label(balance_frame, text="원화: ₩0")
        self.krw_label.pack(anchor=tk.W)
        self.coin_label = ttk.Label(balance_frame, text="코인: 0")
        self.coin_label.pack(anchor=tk.W)
        
        # 가격 정보
        price_frame = ttk.Frame(status_frame)
        price_frame.grid(row=2, column=1, sticky=(tk.W, tk.E))
        
        ttk.Label(price_frame, text="📈 가격 정보", font=("Arial", 10, "bold")).pack(anchor=tk.W)
        self.current_price_label = ttk.Label(price_frame, text="현재가: 0원")
        self.current_price_label.pack(anchor=tk.W)
        self.target_buy_label = ttk.Label(price_frame, text="목표 매수: 0원 (0개)")
        self.target_buy_label.pack(anchor=tk.W)
        self.target_sell_label = ttk.Label(price_frame, text="목표 매도: 0원 (0개)")
        self.target_sell_label.pack(anchor=tk.W)
        
        # 3. 통계 섹션
        stats_frame = ttk.LabelFrame(main_frame, text="📈 통계", padding="10")
        stats_frame.grid(row=3, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        
        # 통계 정보
        stats_left = ttk.Frame(stats_frame)
        stats_left.grid(row=0, column=0, sticky=(tk.W, tk.E), padx=(0, 20))
        
        self.loop_label = ttk.Label(stats_left, text="총 루프: 0")
        self.loop_label.pack(anchor=tk.W)
        self.runtime_label = ttk.Label(stats_left, text="실행시간: 00:00:00")
        self.runtime_label.pack(anchor=tk.W)
        self.total_filled_label = ttk.Label(stats_left, text="총 체결: 0회", font=("Arial", 9, "bold"))
        self.total_filled_label.pack(anchor=tk.W)
        
        stats_right = ttk.Frame(stats_frame)
        stats_right.grid(row=0, column=1, sticky=(tk.W, tk.E))
        
        self.active_orders_label = ttk.Label(stats_right, text="활성 주문: 매수 0개, 매도 0개", font=("Arial", 9, "bold"))
        self.active_orders_label.pack(anchor=tk.W)
        self.buy_stats_label = ttk.Label(stats_right, text="매수 체결: 0회")
        self.buy_stats_label.pack(anchor=tk.W)
        self.sell_stats_label = ttk.Label(stats_right, text="매도 체결: 0회")
        self.sell_stats_label.pack(anchor=tk.W)
        self.cancel_stats_label = ttk.Label(stats_right, text="취소: 0/0")
        self.cancel_stats_label.pack(anchor=tk.W)
        
        # 4. 로그 섹션
        log_frame = ttk.LabelFrame(main_frame, text="📝 활동 로그", padding="10")
        log_frame.grid(row=4, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 10))
        
        # 로그 텍스트 영역
        self.log_text = scrolledtext.ScrolledText(log_frame, height=12, width=90, font=("Courier", 9))
        self.log_text.pack(fill=tk.BOTH, expand=True)
        
        # 그리드 가중치 설정
        main_frame.columnconfigure(0, weight=1)
        main_frame.rowconfigure(4, weight=1)
        self.scrollable_frame.columnconfigure(0, weight=1)
        self.scrollable_frame.rowconfigure(0, weight=1)
        
        # 초기 상태 설정
        self.disable_main_features()
        
        # 초기 로그 메시지
        self.add_log("🔐 라이센스 인증이 필요합니다.")
        self.add_log("💡 라이센스 키를 입력하고 인증을 완료해주세요.")
    
    # === 강제 청산 기능 추가 ===
    def check_liquidation_time(self):
        """강제 청산 일시 확인 - 개별 필드 버전"""
        if not self.enable_liquidation.get() or self.liquidation_executed:
            return False
        
        try:
            # 현재 일시
            now = datetime.now()
            
            # 개별 필드에서 설정된 청산 일시 조합
            liquidation_datetime_str = self.get_liquidation_datetime_string()
            liquidation_datetime = datetime.strptime(liquidation_datetime_str, "%Y-%m-%d %H:%M")
            
            # 일시 비교
            if now >= liquidation_datetime:
                self.add_log(f"🚨 강제 청산 일시 도달: {liquidation_datetime_str}")
                return True
                
        except Exception as e:
            self.add_log(f"❌ 청산 일시 확인 오류: {str(e)}")
        
        return False

    def execute_emergency_liquidation(self):
        """강제 청산 실행"""
        try:
            self.add_log("🚨 강제 청산 시작!")
            self.liquidation_executed = True
            
            # 1. 모든 주문 취소
            self.add_log("📋 모든 주문 취소 중...")
            current_buy_orders, current_sell_orders = self.get_current_orders()
            
            # 매수 주문 취소
            for order in current_buy_orders:
                try:
                    self.cancel_order_precise(order['order_id'], order['type'])
                    time.sleep(0.1)
                except:
                    pass
            
            # 매도 주문 취소
            for order in current_sell_orders:
                try:
                    self.cancel_order_precise(order['order_id'], order['type'])
                    time.sleep(0.1)
                except:
                    pass
            
            # 주문 취소 후 대기
            time.sleep(2.0)
            
            # 2. 현재 잔고 확인
            krw_available, coin_available, krw_total, coin_total = self.get_balances()
            self.add_log(f"💰 현재 {self.target_coin.get()} 잔고: {coin_available:.4f}")
            
            if coin_available <= 0:
                self.add_log("💡 매도할 코인이 없습니다.")
                self.stop_bot()
                return
            
            # 3. 호가창 조회하여 매수 5호가 확인
            orderbook = self.get_orderbook()
            if not orderbook:
                self.add_log("❌ 호가창 조회 실패 - 시장가 매도로 진행")
                self.execute_market_sell(coin_available)
                self.stop_bot()
                return
            
            bids = orderbook.get('bids', [])
            if len(bids) < 5:
                self.add_log("❌ 매수 5호가 정보 부족 - 시장가 매도로 진행")
                self.execute_market_sell(coin_available)
                self.stop_bot()
                return
            
            # 4. 매수 5호가 가격으로 매도 주문
            fifth_bid_price = float(bids[4]['price'])  # 5호가 (인덱스 4)
            tick_size = self.calculate_tick_size(fifth_bid_price)
            sell_price = round(fifth_bid_price / tick_size) * tick_size
            
            self.add_log(f"💸 강제 매도 실행: {coin_available:.4f} @ {sell_price}원 (매수 5호가)")
            
            success = self.place_sell_order(sell_price, coin_available)
            if success:
                self.add_log("✅ 강제 매도 주문 성공!")
            else:
                self.add_log("❌ 강제 매도 주문 실패 - 시장가 매도 시도")
                self.execute_market_sell(coin_available)
            
            # 5. 봇 중지
            time.sleep(1.0)
            self.stop_bot()
            self.add_log("🛑 강제 청산 완료 - 봇 중지됨")
            
        except Exception as e:
            self.add_log(f"❌ 강제 청산 오류: {str(e)}")
            self.stop_bot()

    def execute_market_sell(self, quantity: float):
        """시장가 매도 (호가창 기반)"""
        try:
            orderbook = self.get_orderbook()
            if orderbook and orderbook.get('bids'):
                # 최유리 매수가로 매도
                best_bid = float(orderbook['bids'][0]['price'])
                tick_size = self.calculate_tick_size(best_bid)
                sell_price = round(best_bid / tick_size) * tick_size
                
                self.add_log(f"💸 시장가 매도: {quantity:.4f} @ {sell_price}원")
                self.place_sell_order(sell_price, quantity)
            else:
                self.add_log("❌ 시장가 매도 실패 - 호가 정보 없음")
        except Exception as e:
            self.add_log(f"❌ 시장가 매도 오류: {str(e)}")
        
    def add_log(self, message):
        """로그 메시지 추가"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_message = f"[{timestamp}] {message}\n"
        
        self.log_text.insert(tk.END, log_message)
        self.log_text.see(tk.END)
        
        # 로그가 너무 많아지면 위쪽 삭제 (500줄 유지)
        lines = self.log_text.get("1.0", tk.END).count('\n')
        if lines > 500:
            self.log_text.delete("1.0", "50.0")
    
    def update_gui(self):
        """GUI 정보 업데이트"""
        if not self.is_running:
            return
            
        try:
            # 상태 업데이트
            if self.is_running:
                mode_text = "🚀 활성" if self.current_mode == "active" else "⏳ 대기"
                
                # 강제 청산 일시 표시 추가
                if self.enable_liquidation.get() and not self.liquidation_executed:
                    liquidation_status = f" | 청산: {self.get_liquidation_datetime_string()}"
                else:
                    liquidation_status = ""
                
                self.status_label.config(text=f"🟢 실행중 (Loop #{self.stats['total_loops']}){liquidation_status}")
                self.mode_label.config(text=f"모드: {mode_text} ({self.active_loop_delay.get()}초/{self.idle_loop_delay.get()}초)")
            else:
                self.mode_label.config(text="모드: 대기중")
            
            # 잔고 업데이트
            self.krw_label.config(text=f"원화: ₩{self.krw_available:,.0f} (총 ₩{self.krw_total:,.0f})")
            self.coin_label.config(text=f"{self.target_coin.get()}: {self.coin_available:.4f} (총 {self.coin_total:.4f})")
            
            # 가격 정보 업데이트
            self.current_price_label.config(text=f"현재가: {self.current_price:,.4f}원")
            self.target_buy_label.config(text=f"목표 매수: {self.target_buy_price:,.4f}원 ({self.buy_orders_count}개)")
            self.target_sell_label.config(text=f"목표 매도: {self.target_sell_price:,.4f}원 ({self.sell_orders_count}개)")
            
            # 통계 업데이트
            self.loop_label.config(text=f"총 루프: {self.stats['total_loops']:,}")
            
            # 실제 체결 횟수만 카운트 (주문 제출이 아닌 체결)
            total_filled = self.stats['buy_filled'] + self.stats['sell_filled']
            self.total_filled_label.config(text=f"총 체결: {total_filled}회")
            
            if self.stats['start_time']:
                runtime = datetime.now() - self.stats['start_time']
                runtime_str = str(runtime).split('.')[0]  # 마이크로초 제거
                self.runtime_label.config(text=f"실행시간: {runtime_str}")
            
            # 활성 주문 개수 표시
            self.active_orders_label.config(text=f"활성 주문: 매수 {self.buy_orders_count}개, 매도 {self.sell_orders_count}개")
            
            # 실제 체결 통계 표시
            self.buy_stats_label.config(text=f"매수 체결: {self.stats['buy_filled']}회")
            self.sell_stats_label.config(text=f"매도 체결: {self.stats['sell_filled']}회")
            self.cancel_stats_label.config(text=f"취소: {self.stats['cancel_successes']}/{self.stats['cancel_attempts']}")
            
        except Exception as e:
            pass  # GUI 업데이트 오류는 무시
    
    def start_bot(self):
        """봇 시작"""
        # 인증 확인
        if not self.is_authenticated:
            messagebox.showerror("오류", "라이센스 인증이 필요합니다!")
            return
        
        # 입력 검증
        if not self.connect_key.get() or not self.secret_key.get():
            messagebox.showerror("오류", "API 키를 입력해주세요!")
            return
            
        if not self.target_coin.get():
            messagebox.showerror("오류", "코인명을 입력해주세요!")
            return
        
        # 강제 청산 일시 검증 - 개별 필드 버전
        if self.enable_liquidation.get():
            is_valid, error_msg = self.validate_liquidation_inputs()
            if not is_valid:
                messagebox.showerror("오류", error_msg)
                return
        
        try:
            # pybithumb 인스턴스 생성
            self.bithumb = pybithumb.Bithumb(self.connect_key.get(), self.secret_key.get())
            
            # 간단한 연결 테스트
            test_price = pybithumb.Bithumb.get_current_price(self.target_coin.get().upper())
            if not test_price:
                messagebox.showerror("오류", f"{self.target_coin.get()} 코인을 찾을 수 없습니다!")
                return
                
        except Exception as e:
            messagebox.showerror("오류", f"API 연결 실패: {str(e)}")
            return
        
        # 청산 플래그 초기화
        self.liquidation_executed = False
        
        # 봇 시작
        self.is_running = True
        self.stats['start_time'] = datetime.now()
        
        # 버튼 상태 변경
        self.start_button.config(state="disabled")
        self.stop_button.config(state="normal")
        
        # 봇 쓰레드 시작
        self.bot_thread = threading.Thread(target=self.bot_main_loop, daemon=True)
        self.bot_thread.start()
        
        # GUI 업데이트 타이머 시작
        self.schedule_gui_update()
        
        liquidation_msg = f" (청산: {self.get_liquidation_datetime_string()})" if self.enable_liquidation.get() else ""
        self.add_log(f"🚀 봇 시작! 대상: {self.target_coin.get().upper()}{liquidation_msg}")
    
    def stop_bot(self):
        """봇 중지"""
        self.is_running = False
        
        # 버튼 상태 변경
        self.start_button.config(state="normal")
        self.stop_button.config(state="disabled")
        
        # 상태 레이블 업데이트
        self.status_label.config(text="🔴 중지됨")
        self.mode_label.config(text="모드: 대기중")
        
        self.add_log("🛑 봇 중지됨")
    
    def schedule_gui_update(self):
        """GUI 업데이트 스케줄링"""
        if self.is_running:
            self.update_gui()
            self.root.after(1000, self.schedule_gui_update)  # 1초마다 업데이트
    
    def bot_main_loop(self):
        """봇 메인 루프 (별도 쓰레드) - 강제 청산 추가"""
        try:
            while self.is_running:
                self.stats['total_loops'] += 1
                
                # 강제 청산 시간 체크 (최우선)
                if self.check_liquidation_time():
                    self.execute_emergency_liquidation()
                    break  # 청산 후 루프 종료
                
                # 1. 시세 조회
                current_price = self.get_current_price()
                if not current_price:
                    time.sleep(2.0)
                    continue
                
                self.current_price = current_price
                
                # 2. 호가창 조회
                orderbook = self.get_orderbook()
                if not orderbook:
                    time.sleep(2.0)
                    continue
                
                bids = orderbook.get('bids', [])
                asks = orderbook.get('asks', [])
                
                if not bids or not asks:
                    time.sleep(2.0)
                    continue
                
                # 3. 최유리 가격 및 목표 가격 계산
                current_best_bid = float(bids[0]['price'])
                current_best_ask = float(asks[0]['price'])
                tick_size = self.calculate_tick_size(current_best_bid)
                
                # 목표 가격 계산
                buy_option1 = current_best_bid + tick_size
                buy_option2 = current_best_ask - tick_size
                target_buy_price = min(buy_option1, buy_option2)
                target_buy_price = round(target_buy_price / tick_size) * tick_size
                
                sell_option1 = current_best_ask - tick_size
                sell_option2 = current_best_bid + tick_size
                target_sell_price = max(sell_option1, sell_option2)
                target_sell_price = round(target_sell_price / tick_size) * tick_size
                
                self.target_buy_price = target_buy_price
                self.target_sell_price = target_sell_price
                
                # 4. 현재 주문 조회
                current_buy_orders, current_sell_orders = self.get_current_orders()
                self.buy_orders_count = len(current_buy_orders)
                self.sell_orders_count = len(current_sell_orders)
                
                # 5. 주문 취소 (목표가와 맞지 않는 주문들)
                orders_canceled = self.review_and_cancel_orders(
                    current_buy_orders, current_sell_orders,
                    target_buy_price, target_sell_price,
                    current_best_bid, current_best_ask
                )
                
                # 취소 후 잠시 대기
                if orders_canceled:
                    time.sleep(0.5)
                
                # 6. 잔고 조회
                krw_available, coin_available, krw_total, coin_total = self.get_balances()
                self.krw_available = krw_available
                self.coin_available = coin_available
                self.krw_total = krw_total
                self.coin_total = coin_total
                
                # 7. 체결 감지
                self.detect_filled_orders(krw_total, coin_total)
                
                # 8. 신규 주문 제출 (기존 함수 활용)
                self.manage_buy_orders(krw_available, target_buy_price, 0)  # 현재 주문 수를 0으로 처리
                self.manage_sell_orders(coin_available, target_sell_price, 0)  # 현재 주문 수를 0으로 처리
                
                # 9. 현재 주문 수 업데이트 (GUI 표시용)
                current_buy_orders, current_sell_orders = self.get_current_orders()
                self.buy_orders_count = len(current_buy_orders)
                self.sell_orders_count = len(current_sell_orders)
                
                # 10. 고정 딜레이
                time.sleep(self.active_loop_delay.get())
                
        except Exception as e:
            self.add_log(f"❌ 봇 실행 오류: {str(e)}")
            self.is_running = False
    
    def check_trading_opportunities(self, krw_available: float, coin_available: float, current_buy_orders: int, current_sell_orders: int) -> bool:
        """거래 기회가 있는지 확인"""
        
        # 매수 기회 체크
        available_krw = krw_available * 0.999
        max_buy_orders = int(available_krw // self.buy_unit_krw)
        can_buy = max_buy_orders > current_buy_orders
        
        # 매도 기회 체크
        min_sell_quantity = self.calculate_min_sell_quantity(self.target_sell_price) if self.target_sell_price > 0 else 0
        can_sell = False
        
        if coin_available > 0:
            if coin_available >= min_sell_quantity:
                max_sell_orders = int(coin_available // min_sell_quantity)
                can_sell = max_sell_orders > current_sell_orders
            else:
                # 전체 보유량 매도 가능한 경우
                if current_sell_orders == 0:
                    estimated_value = coin_available * self.target_sell_price if self.target_sell_price > 0 else 0
                    can_sell = estimated_value >= 5000
        
        return can_buy or can_sell
    
    # === 기존 봇 로직 메서드들 ===
    
    def calculate_tick_size(self, price: float) -> float:
        """호가 단위 계산 - 빗썸 기준"""
        try:
            if price < 1:
                return 0.0001
            elif price < 10:
                return 0.001
            elif price < 100:
                return 0.01
            elif price < 5000:
                return 1
            elif price < 10000:
                return 5
            elif price < 50000:
                return 10
            elif price < 100000:
                return 50
            elif price < 500000:
                return 100
            elif price < 1000000:
                return 500
            else:
                return 1000
        except:
            return 0.0001
    
    def get_current_price(self) -> float:
        """현재가 조회"""
        try:
            price = pybithumb.Bithumb.get_current_price(self.target_coin.get().upper())
            return float(price) if price else None
        except Exception as e:
            return None
    
    def get_orderbook(self) -> dict:
        """호가창 조회"""
        try:
            orderbook = pybithumb.Bithumb.get_orderbook(self.target_coin.get().upper(), limit=5)
            return orderbook if orderbook else None
        except Exception as e:
            return None
    
    def get_balances(self) -> tuple:
        """잔고 조회"""
        try:
            # BTC로 원화 잔고 확인
            btc_data = self.bithumb.get_balance("BTC")
            
            if isinstance(btc_data, dict) and 'status' in btc_data:
                return 0, 0, 0, 0
            elif isinstance(btc_data, (list, tuple)) and len(btc_data) >= 4:
                krw_total = float(btc_data[2])
                krw_in_use = float(btc_data[3])
                krw_available = krw_total - krw_in_use
            else:
                krw_total = 0
                krw_available = 0
            
            # 대상 코인 잔고 조회
            coin_data = self.bithumb.get_balance(self.target_coin.get().upper())
            
            if isinstance(coin_data, dict) and 'status' in coin_data:
                coin_total = 0
                coin_available = 0
            elif isinstance(coin_data, (list, tuple)) and len(coin_data) >= 2:
                coin_total = float(coin_data[0])
                coin_in_use = float(coin_data[1])
                coin_available = coin_total - coin_in_use
            else:
                coin_total = 0
                coin_available = 0
            
            return krw_available, coin_available, krw_total, coin_total
            
        except Exception as e:
            return 0, 0, 0, 0
    
    def get_current_orders(self) -> tuple:
        """현재 주문 조회"""
        try:
            orders = self.bithumb.api.orders(order_currency=self.target_coin.get().upper(),
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
        """체결 감지 - 실제 체결만 카운트"""
        if not hasattr(self, 'last_krw_balance'):
            self.last_krw_balance = krw_total
            self.last_coin_balance = coin_total
            return
        
        krw_change = krw_total - self.last_krw_balance
        coin_change = coin_total - self.last_coin_balance
        
        # 실제 체결 감지 및 카운트
        if krw_change < -1000 and coin_change > 0.01:
            self.stats['buy_filled'] += 1  # 매수 체결 카운트 증가
            self.add_log(f"💰 매수체결! 원화 {krw_change:+,.0f} | {self.target_coin.get()} {coin_change:+.4f} [총 체결: {self.stats['buy_filled'] + self.stats['sell_filled']}회]")
        elif coin_change < -0.01 and krw_change > 1000:
            self.stats['sell_filled'] += 1  # 매도 체결 카운트 증가
            self.add_log(f"💰 매도체결! 원화 {krw_change:+,.0f} | {self.target_coin.get()} {coin_change:+.4f} [총 체결: {self.stats['buy_filled'] + self.stats['sell_filled']}회]")
        
        self.last_krw_balance = krw_total
        self.last_coin_balance = coin_total
    
    def review_and_cancel_orders(self, current_buy_orders, current_sell_orders, target_buy_price, target_sell_price, current_best_bid, current_best_ask):
        """주문 검토 및 취소 - 개선된 로깅"""
        canceled = False
        
        # 매수주문 검토
        for order in current_buy_orders:
            order_price = order['price']
            price_diff = abs(order_price - current_best_bid)
            
            # 부동소수점 비교 개선 (0.0001 이하 차이는 같은 것으로 간주)
            is_best_bid = price_diff < 0.0001
            should_cancel = order_price < target_buy_price and not is_best_bid
            
            if should_cancel:
                self.add_log(f"🔍 매수주문 취소 시도: {order_price:.4f}원 (목표: {target_buy_price:.4f}, 최유리: {current_best_bid:.4f})")
                success = self.cancel_order_precise(order['order_id'], order['type'])
                if success:
                    self.add_log(f"✅ 매수주문 취소 성공: {order_price:.4f}원")
                    canceled = True
                else:
                    self.add_log(f"❌ 매수주문 취소 실패: {order_price:.4f}원")
        
        # 매도주문 검토
        for order in current_sell_orders:
            order_price = order['price']
            price_diff = abs(order_price - current_best_ask)
            
            # 부동소수점 비교 개선
            is_best_ask = price_diff < 0.0001
            should_cancel = order_price > target_sell_price and not is_best_ask
            
            if should_cancel:
                self.add_log(f"🔍 매도주문 취소 시도: {order_price:.4f}원 (목표: {target_sell_price:.4f}, 최유리: {current_best_ask:.4f})")
                success = self.cancel_order_precise(order['order_id'], order['type'])
                if success:
                    self.add_log(f"✅ 매도주문 취소 성공: {order_price:.4f}원")
                    canceled = True
                else:
                    self.add_log(f"❌ 매도주문 취소 실패: {order_price:.4f}원")
        
        return canceled
    
    def cancel_order_precise(self, order_id: str, order_type: str) -> bool:
        """정밀 주문 취소 - 상세 로깅"""
        try:
            self.stats['cancel_attempts'] += 1
            type_kr = '매수' if order_type == 'bid' else '매도'
            
            # 방법 1: 기본 cancel_order 시도
            try:
                result = self.bithumb.cancel_order(order_id)
                self.add_log(f"📋 기본취소 응답: {result}")
                
                if isinstance(result, dict):
                    status = result.get('status')
                    if status == '0000':
                        self.stats['cancel_successes'] += 1
                        return True
                    else:
                        message = result.get('message', '')
                        self.add_log(f"❌ 기본취소 실패: {status} - {message}")
                elif result:
                    self.stats['cancel_successes'] += 1
                    return True
            except Exception as e:
                self.add_log(f"❌ 기본취소 예외: {str(e)}")
            
            # 방법 2: order_cancel 사용
            try:
                if hasattr(self.bithumb, 'order_cancel'):
                    result = self.bithumb.order_cancel(order_id, order_type, self.target_coin.get().upper())
                    self.add_log(f"📋 order_cancel 응답: {result}")
                    
                    if isinstance(result, dict) and result.get('status') == '0000':
                        self.stats['cancel_successes'] += 1
                        return True
            except Exception as e:
                self.add_log(f"❌ order_cancel 예외: {str(e)}")
            
            # 방법 3: api.cancel 직접 호출
            try:
                result = self.bithumb.api.cancel(
                    order_id=order_id,
                    type=order_type,
                    order_currency=self.target_coin.get().upper(),
                    payment_currency="KRW"
                )
                self.add_log(f"📋 api.cancel 응답: {result}")
                
                if isinstance(result, dict) and result.get('status') == '0000':
                    self.stats['cancel_successes'] += 1
                    return True
            except Exception as e:
                self.add_log(f"❌ api.cancel 예외: {str(e)}")
            
            self.add_log(f"💔 모든 취소 방법 실패: {order_id}")
            return False
            
        except Exception as e:
            self.add_log(f"💥 취소 함수 예외: {str(e)}")
            return False
    
    def manage_buy_orders(self, krw_available: float, target_buy_price: float, remaining_buy_orders: int):
        """매수 주문 관리"""
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
                        self.add_log(f"🟢 매수주문: {buy_quantity:.4f} @ {target_buy_price}원")
                    else:
                        break
                    time.sleep(self.order_delay)
    
    def manage_sell_orders(self, coin_available: float, target_sell_price: float, remaining_sell_orders: int):
        """매도 주문 관리"""
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
                        self.add_log(f"🔴 매도주문: {min_sell_quantity:.4f} @ {target_sell_price}원")
                    time.sleep(self.order_delay)
        else:
            if remaining_sell_orders == 0:
                estimated_value = coin_available * target_sell_price
                if estimated_value >= 5000:
                    self.stats['sell_attempts'] += 1
                    success = self.place_sell_order(target_sell_price, coin_available)
                    if success:
                        self.stats['sell_successes'] += 1
                        self.add_log(f"🔴 전체매도: {coin_available:.4f} @ {target_sell_price}원")
    
    def place_buy_order(self, price: float, quantity: float) -> bool:
        """매수 주문 제출"""
        try:
            tick_size = self.calculate_tick_size(price)
            normalized_price = round(price / tick_size) * tick_size
            
            # 틱 사이즈가 1 이상이면 소수점 제거
            if tick_size >= 1:
                normalized_price = int(normalized_price)
            
            normalized_quantity = round(quantity, 8)
            
            result = self.bithumb.buy_limit_order(self.target_coin.get().upper(), normalized_price, normalized_quantity)
            
            if isinstance(result, dict):
                status = result.get('status')
                if status == '0000':
                    return bool(result.get('order_id'))
                return False
            elif isinstance(result, (list, tuple)):
                order_id = result[2] if len(result) > 2 else None
                return bool(order_id)
            else:
                return False
                
        except Exception as e:
            return False

    def place_sell_order(self, price: float, quantity: float) -> bool:
        """매도 주문 제출"""
        try:
            tick_size = self.calculate_tick_size(price)
            normalized_price = round(price / tick_size) * tick_size
            
            # 틱 사이즈가 1 이상이면 소수점 제거
            if tick_size >= 1:
                normalized_price = int(normalized_price)
            
            normalized_quantity = round(quantity, 8)
            
            result = self.bithumb.sell_limit_order(self.target_coin.get().upper(), normalized_price, normalized_quantity)
            
            if isinstance(result, dict):
                status = result.get('status')
                if status == '0000':
                    return bool(result.get('order_id'))
                return False
            elif isinstance(result, (list, tuple)):
                order_id = result[2] if len(result) > 2 else None
                return bool(order_id)
            else:
                return False
                
        except Exception as e:
            return False
    
    def calculate_buy_quantity(self, price: float) -> float:
        """매수 수량 계산"""
        tick_size = self.calculate_tick_size(price)
        normalized_price = round(price / tick_size) * tick_size
        quantity = self.buy_unit_krw / normalized_price
        quantity = math.ceil(quantity * 100000000) / 100000000  # 9번째 자리에서 올림하여 8자리
        return quantity
    
    def calculate_min_sell_quantity(self, price: float) -> float:
        """최소 매도 수량 계산"""
        tick_size = self.calculate_tick_size(price)
        normalized_price = round(price / tick_size) * tick_size
        quantity = self.min_order_value / normalized_price
        quantity = math.ceil(quantity * 100000000) / 100000000  # 9번째 자리에서 올림하여 8자리
        return quantity
    
    def run(self):
        """GUI 실행"""
        self.root.mainloop()


def main():
    """메인 함수"""
    try:
        # GUI 봇 생성 및 실행
        bot = BithumbGUIBot()
        bot.run()
    except Exception as e:
        print(f"프로그램 실행 오류: {str(e)}")


if __name__ == "__main__":
    main()