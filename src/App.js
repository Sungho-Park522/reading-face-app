import React, { useState, useCallback, useEffect } from 'react';
// Firebase SDK import 추가
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// Firebase 설정 객체 (Netlify 환경 변수에서 가져올 예정)
// 'process'가 없는 브라우저 환경에서 오류가 나지 않도록 'typeof process'로 확인합니다.
const firebaseConfig = {
  apiKey: typeof process !== 'undefined' ? process.env.REACT_APP_FIREBASE_API_KEY : undefined,
  authDomain: typeof process !== 'undefined' ? process.env.REACT_APP_FIREBASE_AUTH_DOMAIN : undefined,
  projectId: typeof process !== 'undefined' ? process.env.REACT_APP_FIREBASE_PROJECT_ID : undefined,
  storageBucket: typeof process !== 'undefined' ? process.env.REACT_APP_FIREBASE_STORAGE_BUCKET : undefined,
  messagingSenderId: typeof process !== 'undefined' ? process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID : undefined,
  appId: typeof process !== 'undefined' ? process.env.REACT_APP_FIREBASE_APP_ID : undefined,
};

// Firebase 앱 초기화 및 서비스 가져오기
let app, db, auth;
// 모든 설정값이 유효한 경우에만 Firebase를 초기화합니다.
if (Object.values(firebaseConfig).every(v => v)) {
    try {
        // 이미 초기화되었는지 확인
        if (!getApps().length) {
            app = initializeApp(firebaseConfig);
            auth = getAuth(app);
            // 익명으로 로그인하여 Firestore 규칙을 통과
            signInAnonymously(auth).catch((error) => {
                console.error("Anonymous sign-in failed:", error);
            });
        } else {
            app = getApps()[0];
            auth = getAuth(app);
        }
        db = getFirestore(app);
    } catch (error) {
        console.error("Firebase initialization failed:", error);
    }
} else {
    console.warn("Firebase configuration is missing or incomplete. Database features will be disabled.");
}


// 아이콘 정의 (LinkIcon 추가)
const UploadCloudIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m16 16-4-4-4 4"></path></svg> );
const HeartIcon = ({ className, filled }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg> );
const UsersIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> );
const ThumbsUpIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M7 10v12"></path><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a2 2 0 0 1 3 1.88V5.88Z"></path></svg> );
const ThumbsDownIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 14V2"></path><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a2 2 0 0 1-3-1.88V18.12Z"></path></svg> );
const LinkIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg> );
const PlayCircleIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg> );
const RefreshCwIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path></svg> );
const GlobeIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg> );
const ChevronDownIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 12 15 18 9"></polyline></svg> );

// 다국어 텍스트 객체 (공유 관련 문구 추가/수정)
const translations = {
  ko: {
    languageSelectLabel: "언어 변경", languageKorean: "한국어", languageEnglish: "English", languageJapanese: "日本語", languageChinese: "中文", languageSpanish: "Español",
    appTitle: "AI 커플 관상 궁합", appSubtitle: "사진만 올려봐! AI가 두 분의 운명적인 만남, 꿀잼으로 풀어드림! 😉", appDisclaimer: "(재미로 보는 거 알죠? 찡긋~☆)",
    physiognomyIntroTitle: "✨ '관상'이란 무엇일까요?", physiognomyIntroText: "'관상'은 얼굴 생김새를 통해 그 사람의 성격이나 운명을 파악하려는 동양의 전통적인 방법이에요. 이 앱은 재미를 위해 현대적인 AI 기술과 관상의 아이디어를 결합했답니다! 과학적 근거보다는 유쾌한 해석에 집중해주세요!",
    person1Title: "첫 번째 주인공", person2Title: "두 번째 주인공", uploadInstruction: "이목구비가 선명하게 잘 보이는<br/>정면 사진을 올려주세요!",
    uploadButton: "사진 올리기!", fileLoaded: "(로딩 완료!)", analyzeButton: "운명의 궁합 분석 시작!", loadingMessage: "AI가 열일 중! 🔥 거의 다 됐어요!", watchAdButton: "광고 보고 결과 확인! (두근두근)",
    errorMessageDefault: "두 분의 사진을 모두 업로드해주세요. 이목구비가 선명하게 나온 사진일수록 분석이 정확해요!", apiErrorGeneric: "API 요청에 실패했습니다", apiErrorResponseFormat: "AI가 응답을 준비하지 못했어요. 😥 응답 형식이 올바르지 않습니다. 잠시 후 다시 시도해주세요!", apiErrorJsonParse: "앗! AI가 너무 신나서 응답 형식을 살짝 실수했나 봐요. 😂 조금만 기다렸다가 다시 시도해주시면, 이번엔 꼭! 제대로 된 결과를 보여드릴게요!", apiErrorNetwork: "분석 중 얘기치 못한 오류가 발생했어요. 😭 네트워크 상태를 확인하고 다시 시도해주세요!",
    resultTitle: "💖 AI 꿀잼 관상 궁합 결과 💖", personAnalysisTitleSuffix: "님의 관상 총평! 🧐", compatibilityTitle: "두 분의 종합 궁합은 과연?! 💕", scoreUnit: "점!!!",
    scoreDefaultReason: "AI 왈: 이 점수는... 운명입니다! ✨", goodPointsTitle: "이런 점이 완전 찰떡궁합! 👍", improvementPointsTitle: "요것만 조심하면 백년해로 각! ⚠️",
    overallCommentTitle: "✨ AI의 종합 코멘트 ✨", defaultOverallComment: "AI 왈: 두 분, 그냥 결혼하세요! (농담 아님 😉)", adviceTitle: "💡 AI의 핵꿀잼 데이트 비법 전수! 💡",
    shareTwitterButton: "트위터에 소문내기!", shareFacebookButton: "페북에도 알려주기!", retryButton: "첨부터 다시!",
    footerText: "© {year} AI 커플 관상 궁합 (꿀잼 총평판). 만든이도 꿀잼! 😉",
    interstitialAdTitle: "잠시만요! 🚀", interstitialAdBody1: "AI가 두 분의 운명적인 궁합을 빛의 속도로 분석 중이에요!", interstitialAdBody2: "(이 멋진 화면에 광고가 뿅! 나올 수도 있답니다 😉)", interstitialAdLoadingText: "운명의 데스티니 분석 중...",
    rewardedAdTitle: "✨ 특별한 결과 공개 임박! ✨", rewardedAdBody: "잠시 후 광고가 끝나면, 두 분의 놀라운 궁합 결과가 공개됩니다! (두근두근)", rewardedAdFooter: "광고는 스킵 없이! 곧 결과가 팡파레와 함께 등장! 팡! 🎉",
    placeholderImageText1: "첫+번째+분+사진", placeholderImageText2: "두+번째+분+사진", placeholderImageError: "앗!+사진이...+뿅!",
    adPlaceholderBannerText: "꿀잼+광고+배너", adPlaceholderInterstitialText: "두근두근+전면+광고", adPlaceholderRewardedText: "꿀잼+보상형+광고",
    copyButton: "공유 링크 복사하기!", // 버튼 텍스트 변경
    copySuccessMessage: "공유 링크가 복사되었어요! 친구들에게 마구마구 자랑하세요! 💌",
    copyErrorMessage: "앗! 클립보드 복사에 실패했어요. 😅",
    shareMessage: "우리의 커플 관상 궁합 결과가 궁금하다면? 클릭해서 확인해봐! 👇", // 공유 메시지 추가
    resultLoading: "결과를 불러오는 중입니다...",
    resultNotFound: "앗! 해당 결과를 찾을 수 없어요. 주소가 올바른지 확인해주세요.",
    aiPrompt: { jsonFormatInstruction: "답변은 다음 JSON 형식으로 제공해주세요:", instruction: "두 분의 사진이 주어집니다. 각 인물의 전체적인 인상과 성격을 아주 재치 있고 성숙한 유머를 섞어, 마치 '인생 N회차 옆집 형/언니'가 핵심만 콕콕 짚어주듯 분석해주세요. 이때, 각 인물의 **가장 특징적인 이목구비 1~2가지만** 골라서, 그 관상학적 의미를 '아하!' 무릎을 탁 치게 만드는 비유나 유머로 풀어내고, 이것이 전체적인 성격 및 인생관과 어떻게 연결되는지 알려주세요. \"자, 어디 한번 볼까? 이분은 딱 보아하니~\" 같은 느낌으로요. 이 내용을 'overall_impression' 필드에 담아주세요. 분량은 각 사람당 3-4문장 정도로, 너무 가볍지도 무겁지도 않게! 그 후, 두 분의 궁합을 분석해주세요. 궁합 점수(0-100점)와 그 이유를 설명할 때는 \"긴장하시고~ 오늘의 커플 궁합 점수는 바로바로~!\" 처럼 기대감을 주면서도, 결과에 대해서는 '뼈 때리는' 한마디를 덧붙여주세요. 잘 맞는 점('good_points')과 서로 노력하면 좋을 점('areas_for_improvement')은 각각 2가지씩, 마치 '연애 고수'가 현실적인 팩폭과 따뜻한 응원을 동시에 날려주듯 작성해주세요. 예를 들어, '이것만 잘하면 할리우드 커플? 저리 가라 할 케미 폭발 각!' 이런 식으로요. 궁합 총평('overall_summary')은 한 편의 반전 있는 단편 영화 시놉시스처럼, 혹은 다음 화가 궁금해지는 인기 드라마의 명대사처럼 임팩트 있게 요약해주세요. 마지막으로 'advice' 필드에는 두 분이 함께하면 '이런 미친 짓까지 가능하다고?' 싶을 정도로 기상천외하고 재미있는 데이트 아이디어나, '이거 완전 우리 얘기잖아?' 싶은 관계 꿀팁 2가지를 제안해주세요. 모든 텍스트는 핵심을 찌르는 이모티콘(😏, 🔥, 🤣, 💡 등)을 적절히 사용하여 더욱 생동감 있게 만들어주세요!", person1NameExample: "첫 번째 분 별명 (예: 예측불가 자유영혼)", person1ImpressionExample: "오호~ 첫 번째 분, 딱 보니 보통내기가 아니시군요! 😏 자유분방함이 물씬 풍기는 눈빛과 살짝 올라간 입꼬리는 '내 사전에 불가능이란 없다!'를 외치는 듯한데요? 특히, 그 어디에도 얽매이지 않을 듯한 이마 라인은 '인생은 한 번뿐!' YOLO 정신을 제대로 보여줍니다. 덕분에 주변에 늘 신선한 영감을 주지만, 가끔 너무 즉흥적이라 '어디로 튈지 모르는 탱탱볼' 같다는 소리 좀 듣겠어요! 🤣", person2NameExample: "두 번째 분 별명 (예: 반전매력 철벽수비수)", person2ImpressionExample: "두 번째 분은 겉으로는 '접근금지' 아우라를 풍기는 철벽수비수 같지만, 알고 보면 속정이 깊은 반전매력의 소유자시네요! 🧐 반듯한 콧날과 다부진 입매는 '한번 마음먹은 건 끝까지 간다!'는 의지를 보여주지만, 의외의 순간에 보여주는 따뜻한 눈빛이 이분의 진짜 매력 포인트! 🔥 신중함도 좋지만, 가끔은 그 철벽, 살짝 내려놓고 달려보는 용기도 필요할 때가 있답니다!", compatibilityScoreReasonExample: "🎉 두구두구~ 이 커플, 궁합 점수는 무려 88점! 이거 완전 '환장의 커플'에서 '환상의 커플'로 진화 직전인데요?! 💕 서로 다른 매력이 만나 예상치 못한 시너지를 뿜어내는, 그야말로 '단짠단짠' 조합이랍니다! (근데 가끔 너무 짜거나 달아서 속 쓰릴 수 있음 주의! 😉)", goodPoint1Example: "첫 번째 분의 '일단 저지르고 보자!' 정신과 두 번째 분의 '돌다리도 부숴버릴 기세로 두드려보자!' 정신이 만나면? 세상에 없던 창조적인 결과물이 뙇! 어쩌면 세상을 바꿀지도? 💡", goodPoint2Example: "서로의 '덕질' 영역을 존중하다 못해 함께 빠져들다 보면, '어? 내가 이런 걸 좋아했었나?' 싶은 신세계를 경험하며 관계의 깊이가 남달라질 거예요! (단, 통장 잔고는 책임 못 짐 🤣)", improvementPoint1Example: "가끔 첫 번째 분이 너무 앞서나가서 두 번째 분이 '저기요, 잠깐만요!'를 외치기도 전에 저만치 가버리거나, 두 번째 분이 너무 신중해서 첫 번째 분이 '아, 속 터져! 내가 그냥 할게!'를 시전할 수 있어요. 서로의 '속도 조절' 능력 만렙 찍기가 시급합니다! 🚀", improvementPoint2Example: "표현 방식이 너무 달라서 '화성에서 온 남자, 금성에서 온 여자' 시즌2 찍을 뻔! 할 때가 있을 거예요. '척하면 척'도 좋지만, 가끔은 '말로 해야 압니다, 네?' 스킬도 장착해야 서로 오해 없이 오래오래 행복할 수 있어요! 💬", overallSummaryExample: "이 커플, 한마디로 '예측불가 롤러코스터'입니다! 🎢 조용할 날 없이 티격태격하면서도 서로 없이는 못 사는, 그런 애증(?)의 관계랄까요? 하지만 분명한 건, 두 분의 삶은 서로로 인해 훨씬 더 다채롭고 유쾌해질 거라는 사실! 지루함은 저 멀리 안드로메다로 보내버리고, 이 스릴 넘치는 여정을 마음껏 즐겨보시길! 🔥", advice1Example: "둘만의 '아무 말 대잔치 데이트'는 어때요? 하루 동안 서로에게 떠오르는 아무 말이나 필터 없이 던져보는 거예요! (단, 끝나고 뒤끝 없기! 🤙) 의외의 진심이나 빵 터지는 유머를 발견할지도 몰라요!", advice2Example: "서로의 '흑역사 배틀'을 열어보세요! 가장 창피했던 과거 사진이나 에피소드를 공유하며 누가 더 강력한 흑역사를 가졌는지 겨뤄보는 거죠! 웃다가 눈물 콧물 다 쏟아도 책임 안 집니다! 😂 이 과정을 통해 서로의 인간적인 매력에 더 깊이 빠져들 거예요!", languageInstructionSuffix: "모든 설명은 선택된 언어(한국어)로 매우 친근하고 재미있게, 유머와 긍정적인 에너지를 담아 작성해주세요." }
  },
  en: { /* ... */ }, ja: { /* ... */ }, zh: { /* ... */ }, es: { /* ... */ }
};

const getBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result); // Base64 전체 문자열 반환 (data:image/png;base64,...)
    reader.onerror = (error) => reject(error);
});

const App = () => {
  const [language, setLanguage] = useState('ko');
  const [currentStrings, setCurrentStrings] = useState(translations.ko);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const [person1ImageFile, setPerson1ImageFile] = useState(null);
  const [person1ImagePreview, setPerson1ImagePreview] = useState(null);
  const [person2ImageFile, setPerson2ImageFile] = useState(null);
  const [person2ImagePreview, setPerson2ImagePreview] = useState(null);

  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 공유 및 결과 페이지 상태 추가
  const [pageState, setPageState] = useState('main'); // 'main', 'loadingResult', 'resultView'
  const [resultId, setResultId] = useState(null);

  const [showInterstitialAd, setShowInterstitialAd] = useState(false);
  const [isAdWatched, setIsAdWatched] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isWatchingRewardedAd, setIsWatchingRewardedAd] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');

  // 페이지 로드 시 URL을 확인하여 공유된 결과인지 판별
  useEffect(() => {
    const path = window.location.pathname.split('/');
    if (path[1] === 'result' && path[2]) {
        const id = path[2];
        setPageState('loadingResult'); // 결과 로딩 상태로 변경
        
        const fetchResult = async () => {
            try {
                if (!db) throw new Error("Firestore is not initialized.");
                const docRef = doc(db, "results", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const resultData = docSnap.data();
                    // Firestore에 저장된 언어로 앱 언어 설정 (선택적)
                    if (resultData.language && translations[resultData.language]) {
                        setLanguage(resultData.language);
                    }
                    setAnalysisResult(resultData.analysis);
                    setPerson1ImagePreview(resultData.person1Image);
                    setPerson2ImagePreview(resultData.person2Image);
                    setResultId(id);
                    setPageState('resultView');
                    setShowResults(true);
                } else {
                    setError(currentStrings.resultNotFound);
                    setPageState('main');
                }
            } catch (e) {
                console.error("Error fetching result:", e);
                setError(currentStrings.resultNotFound);
                setPageState('main');
            }
        };
        fetchResult();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 이 useEffect는 처음 마운트될 때만 실행되어야 합니다.

  useEffect(() => {
    setCurrentStrings(translations[language]);
    resetPlaceholders(translations[language]);
  }, [language]);

  const resetPlaceholders = (strings) => {
    if (!person1ImageFile) setPerson1ImagePreview(`https://placehold.co/400x400/e2e8f0/cbd5e0?text=${strings.placeholderImageText1}`);
    if (!person2ImageFile) setPerson2ImagePreview(`https://placehold.co/400x400/e9d5ff/a855f7?text=${strings.placeholderImageText2}`);
  }

  const selectLanguage = (langCode) => {
    setLanguage(langCode);
    setShowLanguageDropdown(false);
  };
  
  const resetAllStates = () => {
    // URL을 메인으로 변경
    window.history.pushState({}, '', '/');

    setPerson1ImageFile(null);
    setPerson2ImageFile(null);
    setAnalysisResult(null);
    setError('');
    setShowInterstitialAd(false);
    setIsAdWatched(false);
    setShowResults(false);
    setIsWatchingRewardedAd(false);
    setCopyStatus('');
    setIsLoading(false);
    setPageState('main');
    setResultId(null);
    resetPlaceholders(currentStrings);
  };

  const handleImageChange = (event, person) => {
    const file = event.target.files[0];
    if (file) {
      getBase64(file).then(base64Image => {
        if (person === 1) {
          setPerson1ImageFile(file);
          setPerson1ImagePreview(base64Image);
        } else {
          setPerson2ImageFile(file);
          setPerson2ImagePreview(base64Image);
        }
      });
      setAnalysisResult(null);
      setError('');
      setShowInterstitialAd(false);
      setIsAdWatched(false);
      setShowResults(false);
      setIsWatchingRewardedAd(false);
      setCopyStatus('');
    }
  };

  const saveResultToFirestore = async (analysis, person1Image, person2Image, lang) => {
      if (!db) {
          throw new Error("Firestore is not initialized. Check Firebase config and connection.");
      }
      try {
          const docRef = await addDoc(collection(db, "results"), {
              analysis,
              person1Image,
              person2Image,
              language: lang, // 결과 생성 시 언어 저장
              createdAt: serverTimestamp() // TTL을 위한 타임스탬프
          });
          return docRef.id;
      } catch (e) {
          console.error("Error adding document: ", e);
          throw new Error("Failed to save result to server.");
      }
  };
  
  const handleAnalysis = useCallback(async () => {
    if (!person1ImageFile || !person2ImageFile) {
      setError(currentStrings.errorMessageDefault);
      return;
    }
    
    const apiKey = typeof process !== 'undefined' ? process.env.REACT_APP_GEMINI_API_KEY : undefined;
    if (!apiKey) {
        setError("API Key is not configured. Please contact the administrator.");
        return;
    }

    setIsLoading(true); setShowInterstitialAd(true);
    setError(''); setAnalysisResult(null); setIsAdWatched(false); setShowResults(false);

    try {
      const base64Image1Data = await getBase64(person1ImageFile);
      const base64Image2Data = await getBase64(person2ImageFile);
      
      const base64Image1 = base64Image1Data.split(',')[1];
      const mimeType1 = person1ImageFile.type;
      const base64Image2 = base64Image2Data.split(',')[1];
      const mimeType2 = person2ImageFile.type;
      
      const currentPromptStrings = currentStrings.aiPrompt;
      const langName = language === 'ko' ? '한국어' : language === 'en' ? 'English' : language === 'ja' ? '日本語' : language === 'zh' ? '中文' : 'Español';
      const prompt = `${currentPromptStrings.instruction}\n\n${currentPromptStrings.jsonFormatInstruction}\n{\n  "person1_analysis": {\n    "name": "${currentPromptStrings.person1NameExample}", \n    "overall_impression": "${currentPromptStrings.person1ImpressionExample}"\n  },\n  "person2_analysis": {\n    "name": "${currentPromptStrings.person2NameExample}",\n    "overall_impression": "${currentPromptStrings.person2ImpressionExample}"\n  },\n  "compatibility": {\n    "score": 88, \n    "score_reason": "${currentPromptStrings.compatibilityScoreReasonExample}",\n    "good_points": [\n      "${currentPromptStrings.goodPoint1Example}",\n      "${currentPromptStrings.goodPoint2Example}"\n    ],\n    "areas_for_improvement": [\n      "${currentPromptStrings.improvementPoint1Example}",\n      "${currentPromptStrings.improvementPoint2Example}"\n    ],\n    "overall_summary": "${currentPromptStrings.overallSummaryExample}",\n    "advice": [\n      "${currentPromptStrings.advice1Example}",\n      "${currentPromptStrings.advice2Example}"\n    ]\n  }\n}\n${currentPromptStrings.languageInstructionSuffix.replace(/\(([^)]+)\)/, `(${langName})`)}`;

      const payload = {
        contents: [ { role: "user", parts: [ { text: prompt }, { inlineData: { mimeType: mimeType1, data: base64Image1 } }, { inlineData: { mimeType: mimeType2, data: base64Image2 } } ] } ],
        generationConfig: { responseMimeType: "application/json" }
      };
      
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`${currentStrings.apiErrorGeneric}: ${errorData.error?.message || response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts[0]) {
          const parsedJson = JSON.parse(result.candidates[0].content.parts[0].text);
          setAnalysisResult(parsedJson);
          const newResultId = await saveResultToFirestore(parsedJson, base64Image1Data, base64Image2Data, language);
          setResultId(newResultId);
          window.history.pushState({}, '', `/result/${newResultId}`);
      } else {
          throw new Error(currentStrings.apiErrorResponseFormat);
      }
      
      setIsLoading(false); setShowInterstitialAd(false);

    } catch (err) {
      console.error('분석 또는 저장 중 오류 발생:', err);
      setError(`${err.message}`);
      setIsLoading(false); setShowInterstitialAd(false);
    }
  }, [person1ImageFile, person2ImageFile, currentStrings, language]);
  
  const handleWatchRewardedAd = () => {
    setIsWatchingRewardedAd(true);
    setTimeout(() => {
      setIsAdWatched(true);
      setShowResults(true);
      setIsWatchingRewardedAd(false);
      setPageState('resultView');
    }, 3000);
  };
  
  const handleCopyToClipboard = () => {
    if (!resultId) return;
    const shareUrl = `${window.location.origin}/result/${resultId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
        setCopyStatus(currentStrings.copySuccessMessage);
    }).catch(err => {
        setCopyStatus(currentStrings.copyErrorMessage);
        console.error('클립보드 복사 실패:', err);
    });
    setTimeout(() => setCopyStatus(''), 3000);
  };
  
  const generateShareText = () => {
      return currentStrings.shareMessage;
  };
  
  const renderHearts = (score) => (
      <div className="flex">
        {[...Array(5)].map((_, i) => ( <HeartIcon key={i} className={`w-8 h-8 ${i < Math.round((score/100)*5) ? 'text-red-500' : 'text-gray-300'}`} filled={i < Math.round((score/100)*5)} /> ))}
      </div>
  );
  
  const MainPageComponent = () => (
    <>
      <section className="mb-8 p-4 bg-indigo-50 rounded-lg shadow">
        <h3 className="text-xl font-bold text-indigo-700 mb-2 text-center">{currentStrings.physiognomyIntroTitle}</h3>
        <p className="text-sm text-gray-600 leading-relaxed text-center">{currentStrings.physiognomyIntroText}</p>
      </section>
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {[1, 2].map(personNum => (
          <div key={personNum} className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors flex flex-col items-center ${personNum === 1 ? 'border-rose-300 hover:border-rose-500 bg-rose-50/50' : 'border-fuchsia-300 hover:border-fuchsia-500 bg-fuchsia-50/50'}`}>
            <h2 className="text-2xl font-bold mb-3">{personNum === 1 ? currentStrings.person1Title : currentStrings.person2Title} 👑</h2>
            <p className="text-sm text-gray-600 mb-3" dangerouslySetInnerHTML={{ __html: currentStrings.uploadInstruction }}></p>
            <img src={personNum === 1 ? person1ImagePreview : person2ImagePreview} alt={`${personNum === 1 ? currentStrings.person1Title : currentStrings.person2Title}`} className="w-48 h-48 md:w-56 md:h-56 object-cover mx-auto rounded-full shadow-xl mb-4 border-4 border-white" onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x400/f87171/fecaca?text=${currentStrings.placeholderImageError.replace(/\+/g, '%20')}`; }}/>
            <label htmlFor={`person${personNum}ImageUpload`} className={`cursor-pointer inline-flex items-center justify-center px-6 py-3 text-white font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105 mt-auto text-lg ${personNum === 1 ? 'bg-rose-500 hover:bg-rose-600' : 'bg-fuchsia-500 hover:bg-fuchsia-600'}`}>
              <UploadCloudIcon className="w-6 h-6 mr-2" />
              {currentStrings.uploadButton}
            </label>
            <input type="file" id={`person${personNum}ImageUpload`} accept="image/*" onChange={(e) => handleImageChange(e, personNum)} className="hidden" />
            {(personNum === 1 ? person1ImageFile : person2ImageFile) && <p className="text-xs text-gray-500 mt-2">{(personNum === 1 ? person1ImageFile : person2ImageFile).name} {currentStrings.fileLoaded}</p>}
          </div>
        ))}
      </section>
      <section className="mb-8 text-center">
        {!analysisResult && !isLoading && (
          <button onClick={handleAnalysis} disabled={!person1ImageFile || !person2ImageFile} className="px-12 py-5 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold text-2xl rounded-lg shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100">
            <HeartIcon className="inline-block w-8 h-8 mr-2 animate-ping" filled={true} />
            {currentStrings.analyzeButton}
          </button>
        )}
        {isLoading && (<p className="text-xl text-purple-700 font-semibold animate-bounce">{currentStrings.loadingMessage}</p>)}
        {analysisResult && !isLoading && !showResults && (
            <button onClick={handleWatchRewardedAd} className="px-10 py-5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold text-xl rounded-lg shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center mx-auto">
                <PlayCircleIcon className="w-7 h-7 mr-2" />
                {currentStrings.watchAdButton}
            </button>
        )}
        {error && <p className="text-red-500 bg-red-100 border border-red-300 rounded-md p-4 text-md mt-4 max-w-md mx-auto shadow-md animate-shake">{error}</p>}
      </section>
    </>
  );

  const ResultPageComponent = () => (
    <section className="bg-white/80 p-6 rounded-xl shadow-xl mt-8 font-gowun text-lg">
      <h2 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 mb-8 animate-bounce">{currentStrings.resultTitle}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="flex flex-col items-center">
            <img src={person1ImagePreview} alt={currentStrings.person1Title} className="w-48 h-48 md:w-56 md:h-56 object-cover mx-auto rounded-full shadow-xl border-4 border-white"/>
            <h3 className="text-2xl font-bold mt-4 text-rose-600">{analysisResult.person1_analysis?.name || currentStrings.person1Title}</h3>
          </div>
          <div className="flex flex-col items-center">
            <img src={person2ImagePreview} alt={currentStrings.person2Title} className="w-48 h-48 md:w-56 md:h-56 object-cover mx-auto rounded-full shadow-xl border-4 border-white"/>
            <h3 className="text-2xl font-bold mt-4 text-fuchsia-600">{analysisResult.person2_analysis?.name || currentStrings.person2Title}</h3>
          </div>
      </div>
      
      {analysisResult && (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {[analysisResult.person1_analysis, analysisResult.person2_analysis].map((person, personIndex) => (
                <div key={personIndex} className={`p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300 ${personIndex === 0 ? 'bg-gradient-to-br from-rose-100 to-pink-200 border-rose-300' : 'bg-gradient-to-br from-fuchsia-100 to-purple-200 border-fuchsia-300'} border-2`}>
                  <h3 className={`text-3xl font-bold mb-4 text-center ${personIndex === 0 ? 'text-rose-600' : 'text-fuchsia-600'}`}>{(person?.name || (personIndex === 0 ? currentStrings.person1Title : currentStrings.person2Title))} {currentStrings.personAnalysisTitleSuffix}</h3>
                  <div className="relative"><p className="text-md leading-relaxed whitespace-pre-line p-4 bg-white/70 rounded-lg shadow-inner">{person?.overall_impression || "..."}</p></div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-indigo-100 to-blue-200 p-6 rounded-xl shadow-xl border-2 border-indigo-300">
              <h3 className="text-3xl font-bold text-indigo-700 mb-6 text-center">{currentStrings.compatibilityTitle}</h3>
              <div className="flex justify-center mb-4">{renderHearts(analysisResult.compatibility?.score || 0)}</div>
              <p className="text-5xl font-bold text-indigo-600 mb-2 text-center animate-pulse">{analysisResult.compatibility?.score || 0}{currentStrings.scoreUnit}</p>
              <p className="text-md text-gray-700 mb-6 italic text-center p-2 bg-white/50 rounded-md">{analysisResult.compatibility?.score_reason || currentStrings.scoreDefaultReason}</p>
              <div className="text-left space-y-6">
                {analysisResult.compatibility?.good_points?.length > 0 && (
                  <div><h4 className="text-xl font-bold text-green-700 mb-2 flex items-center"><ThumbsUpIcon className="w-6 h-6 mr-2 text-green-500" /> {currentStrings.goodPointsTitle}</h4>
                    {analysisResult.compatibility.good_points.map((point, index) => (<p key={index} className="text-md text-gray-800 mb-1 p-3 bg-green-100 rounded-lg shadow-sm">- {point}</p>))}</div>
                )}
                {analysisResult.compatibility?.areas_for_improvement?.length > 0 && (
                  <div><h4 className="text-xl font-bold text-red-700 mb-2 flex items-center"><ThumbsDownIcon className="w-6 h-6 mr-2 text-red-500" /> {currentStrings.improvementPointsTitle}</h4>
                    {analysisResult.compatibility.areas_for_improvement.map((area, index) => (<p key={index} className="text-md text-gray-800 mb-1 p-3 bg-red-100 rounded-lg shadow-sm">- {area}</p>))}</div>
                )}
              </div>
              <h4 className="text-2xl font-bold text-indigo-700 mt-8 mb-3 text-center">{currentStrings.overallCommentTitle}</h4>
              <p className="text-md text-gray-800 leading-relaxed whitespace-pre-line p-4 bg-white/70 rounded-lg shadow-inner mb-8">{analysisResult.compatibility?.overall_summary || currentStrings.defaultOverallComment}</p>
              <h4 className="text-2xl font-bold text-indigo-700 mt-8 mb-3 text-center">{currentStrings.adviceTitle}</h4>
              {analysisResult.compatibility?.advice?.map((adv, index) => (<p key={index} className="text-md text-gray-800 mb-2 p-3 bg-indigo-100 rounded-lg shadow-sm">- {adv}</p>))}
            </div>

            <div className="mt-10 pt-6 border-t border-gray-300 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={handleCopyToClipboard} className="w-full sm:w-auto flex items-center justify-center px-5 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-lg transition-colors text-md">
                <LinkIcon className="w-5 h-5 mr-2" /> {currentStrings.copyButton}
              </button>
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(generateShareText())}&url=${window.location.origin}/result/${resultId}`} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto flex items-center justify-center px-5 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-lg shadow-lg transition-colors text-md">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                {currentStrings.shareTwitterButton}
              </a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${window.location.origin}/result/${resultId}`} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto flex items-center justify-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-colors text-md">
                 <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12Z" clipRule="evenodd"></path></svg>
                {currentStrings.shareFacebookButton}
              </a>
              <button onClick={resetAllStates} className="w-full sm:w-auto flex items-center justify-center px-5 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg shadow-lg transition-colors text-md">
                <RefreshCwIcon className="w-5 h-5 mr-2" /> {currentStrings.retryButton}
              </button>
            </div>
            {copyStatus && <p className="text-center text-md text-green-700 mt-4 font-semibold animate-bounce">{copyStatus}</p>}
        </>
      )}
    </section>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 p-4 sm:p-6 lg:p-8 flex flex-col items-center font-gaegu text-gray-700">
      <header className="w-full max-w-4xl mt-16 sm:mt-12 mb-8 text-center">
        <h1 className="text-5xl sm:text-6xl font-bold text-white py-2 flex items-center justify-center drop-shadow-lg">
          <UsersIcon className="inline-block w-12 h-12 mr-3 text-pink-300" />
          {currentStrings.appTitle}
          <HeartIcon className="inline-block w-12 h-12 ml-3 text-red-400 animate-pulse" filled={true} />
        </h1>
        <p className="text-xl text-white mt-3 drop-shadow-md">{currentStrings.appSubtitle}</p>
        <p className="text-sm text-white/80 mt-1 drop-shadow-sm">{currentStrings.appDisclaimer}</p>
      </header>
      
      <main className="w-full max-w-4xl bg-white/95 backdrop-blur-md shadow-2xl rounded-xl p-6 sm:p-8">
        {pageState === 'loadingResult' && <p className="text-center text-xl text-purple-700 font-semibold">{currentStrings.resultLoading}</p>}
        {pageState === 'main' && <MainPageComponent />}
        {pageState === 'resultView' && analysisResult && <ResultPageComponent />}
        {pageState === 'main' && error && <p className="text-red-500 bg-red-100 border border-red-300 rounded-md p-4 text-md mt-4 max-w-md mx-auto shadow-md animate-shake">{error}</p>}
      </main>

      <footer className="w-full max-w-4xl mt-12 text-center">
        <p className="text-md text-white/90 drop-shadow-sm">{currentStrings.footerText.replace('{year}', new Date().getFullYear())}</p>
      </footer>
    </div>
  );
};

export default App;
