from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
import time

# 1. ChromeDriver 경로 설정
chrome_path = "chromedriver.exe"  # 또는 전체 경로 지정 (예: C:/Tools/chromedriver.exe)

# 2. 드라이버 실행 옵션
options = webdriver.ChromeOptions()
options.add_argument('--headless')  # 브라우저 창 숨김 (옵션)
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

# 3. 드라이버 실행
service = Service(chrome_path)
driver = webdriver.Chrome(service=service, options=options)

try:
    # 4. 페이지 접속
    url = "https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=%EA%B8%88+%EC%8B%9C%EC%84%B8&ackey=m4ravq1g"
    driver.get(url)
    time.sleep(2.5)  # JS 렌더링 대기 (조정 가능)

    # 5. XPath로 요소 선택 및 텍스트 추출
    xpath = '//*[@id="main_pack"]/section[2]/div[1]/div[2]/div[2]/div[3]/div[2]/span'
    price_element = driver.find_element(By.XPATH, xpath)
    print("3.75g 금 시세:", price_element.text)

except Exception as e:
    print("오류 발생:", e)

finally:
    driver.quit()
