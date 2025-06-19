import React, { useState, useCallback, useEffect } from 'react';
// Firebase SDK import
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "firebase/storage";


// ★★★ API 키 설정 영역 ★★★
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;


// Firebase 앱 초기화 및 서비스 가져오기
let app, db, auth, storage;
if (Object.values(firebaseConfig).every(v => v)) {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      signInAnonymously(auth).catch((error) => {
        console.error("Anonymous sign-in failed:", error);
      });
    } else {
      app = getApps()[0];
      auth = getAuth(app);
    }
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.warn("Firebase configuration is missing. Database features will be disabled in the Preview environment.");
}


// 아이콘 정의
const UploadCloudIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m16 16-4-4-4 4"></path></svg>);
const HeartIcon = ({ className, filled }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>);
const UsersIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>);
const UserIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const LinkIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>);
const RefreshCwIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path></svg>);
const PlusCircleIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>);
const CalendarIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>);
const SparklesIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.9 5.8-5.8 1.9 5.8 1.9 1.9 5.8 1.9-5.8 5.8-1.9-5.8-1.9z"/><path d="M22 12a10 10 0 1 1-10-10"/><path d="M22 12a10 10 0 0 0-10-10"/></svg>);


// 다국어 텍스트 객체 (전체) - 신규 기능 관련 텍스트 추가
const translations = {
  ko: {
    languageName: "한국어",
    languageSelectLabel: "언어 변경",
    appTitle: "AI 관상 & 궁합", appSubtitle: "사진과 생년월일로 AI가 당신의 운명을 분석해드려요!",
    physiognomyIntroTitle: "✨ '관상'과 '사주'란?", physiognomyIntroText: "'관상'은 얼굴로, '사주'는 태어난 시간으로 사람의 운명을 해석하는 동양의 지혜입니다. 이 앱은 AI 기술을 활용해 이 둘을 재미있게 분석해 드립니다. 과학적 근거보다는 유쾌한 해석에 집중해주세요!",
    person1Title: "분석할 분", person2Title: "궁합 볼 상대",
    uploadInstruction: "얼굴이 선명한 정면 사진을 올려주세요.",
    dobLabel: "생년월일", dobPlaceholder: "YYYY-MM-DD",
    addCoupleButton: "+ 궁합 보기", removeCoupleButton: "x 혼자 보기",
    analyzeButtonSingle: "AI 개인 운명 분석", analyzeButtonCouple: "AI 커플 궁합 분석",
    loadingMessage: "AI가 열일 중! 🔥 거의 다 됐어요!",
    watchAdButton: "광고 보고 결과 확인!",
    errorMessageDefault: "사진과 생년월일을 모두 입력해주세요. 얼굴이 선명한 사진일수록 분석이 정확해요!",
    noFaceDetectedError: "앗, 사진에서 얼굴을 찾기 어려워요! 😅 이목구비가 선명하게 나온 정면 사진으로 다시 시도해주시면 더 정확한 관상을 볼 수 있답니다.",
    apiErrorGeneric: "API 요청에 실패했습니다", apiErrorResponseFormat: "AI가 응답을 준비하지 못했어요. 😥 응답 형식이 올바르지 않습니다. 잠시 후 다시 시도해주세요!",
    resultTitleSingle: "✨ AI 개인 운명 분석 결과 ✨", resultTitleCouple: "💖 AI 커플 궁합 결과 💖",
    tabPerson1: "첫 번째 분", tabPerson2: "두 번째 분", tabCompatibility: "종합 궁합",
    sectionPhysiognomy: "관상 분석", sectionSaju: "사주 분석", sectionIntegrated: "관상+사주 통합 해석",
    compatibilityTitle: "두 분의 종합 궁합은 과연?! 💕",
    scoreUnit: "점!!!",
    retryButton: "처음부터 다시하기",
    copyButton: "공유 링크 복사", copySuccessMessage: "공유 링크가 복사되었어요!",
    resultLoading: "결과를 불러오는 중입니다...", resultNotFound: "앗! 해당 결과를 찾을 수 없어요.",
    loadingComments: ["오, 이 눈썹... 심상치 않은데요? 🤔", "콧대가 예술이군요. 잠시 감상 좀...👃", "타고난 운명의 기운을 읽는 중... ✨", "입꼬리가 닮았네요! 이건 운명일지도? 🤭", "잠시만요, 이마에서 빛이... 광채 분석 중! 💡"],
    adPlaceholderBannerText: "꿀잼 광고 배너",
    shareMessage: "나의 AI 운명 분석 결과가 궁금하다면? 클릭해서 확인해봐! 👇",
    // *** FIX: 프롬프트 최신화 ***
    aiPromptSingle: `당신은 관상과 사주에 정통한 유머러스하고 통찰력 있는 AI 도사입니다. 사용자의 사진과 생년월일을 기반으로 한 사람의 운명을 다층적으로 분석해주세요.

    🎯 목적:
    - 사용자가 "내가 어떤 사람인지", "어떤 삶을 살 가능성이 있는지", "어떻게 살아야 하는지"에 대해 **웃기고 통찰력 있는 통합 결과**를 얻는 것
    - 분석 결과가 **SNS에서 공유하고 싶은 재미와 몰입감**을 제공해야 함
    
    📌 규칙:
    1. **관상 분석**: 눈, 코, 입, 턱, 얼굴형 등 사진 기반의 특징을 풍부하게 묘사하고, 그 의미를 해석해주세요. 외형 묘사는 유머와 비유로 풀어주세요.
    2. **사주 분석**: 태어난 연월일시(양력 기준)로 오행/십성/용신 관점에서 해석하되, 쉽게 설명해주세요. "봄에 핀 꽃", "겨울의 얼음", "뜨거운 금속" 등 비유적으로.
    3. **통합 분석**: 관상과 사주의 핵심 포인트를 연결해 통합적인 운명/성격/조언을 제공해주세요. 단순 요약이 아니라, 새로운 **의미의 연결**을 만들어주세요.  
    4. **길이**: 각 분석은 3~6문장 이상으로 상세하게, 핵심 내용은 드라마틱하게  
    5. **형식**: 반드시 아래 JSON 구조로 응답할 것. \`analysis_type\`은 'single'로 고정
    
    🧾 JSON 형식:
    {
      "analysis_type": "single",
      "person_analysis": {
        "name": "[사용자의 특징을 표현하는 별명]",
        "physiognomy_analysis": "[관상 분석]",
        "saju_analysis": "[사주 분석]",
        "integrated_analysis": "[관상과 사주를 연결한 통합 분석 결과]"
      }
    }`,
    aiPromptCouple: `당신은 관상과 사주에 능통하고, 관계 통찰력과 유머 감각까지 갖춘 AI 커플 운명 분석가입니다. 두 사람의 사진과 생년월일을 바탕으로, 각자의 운세와 둘의 궁합을 드라마틱하고 공감 가는 방식으로 분석해주세요.

    🎯 목적:
    - 두 사람의 관계가 "어떻게 흘러갈지", "왜 이런 사람을 만났는지", "어떻게 하면 잘 지낼 수 있는지"에 대한 유쾌한 통찰 제공
    - SNS에서 공유하고 싶은 감정적/재미있는 궁합 결과를 제공할 것
    
    📌 규칙:
    1. **개인 분석**: 두 사람 각각에 대해 관상+사주를 개별적으로 분석 (각각 3~6문장 이상)
    2. **궁합 분석**: 
       - 관상 궁합: 외모/표정/인상 기반 궁합
       - 사주 궁합: 오행 조화, 성격 상극 여부 등
       - 종합 해석: 갈등 요소/시너지/연애 조언 등을 중심으로 드라마틱하게 설명
    3. **점수**: \`score\`는 100점 만점 기준으로 부여하되, 감정이입 가능한 사유(\`score_reason\`)를 함께 설명
    4. **형식**: 반드시 아래 JSON 형식으로 응답할 것. \`analysis_type\`은 "couple" 고정
    
    🧾 JSON 형식:
    {
      "analysis_type": "couple",
      "person1_analysis": {
        "name": "[첫 번째 사람 별명]",
        "physiognomy_analysis": "[관상 분석]",
        "saju_analysis": "[사주 분석]"
      },
      "person2_analysis": {
        "name": "[두 번째 사람 별명]",
        "physiognomy_analysis": "[관상 분석]",
        "saju_analysis": "[사주 분석]"
      },
      "compatibility": {
        "score": 0,
        "score_reason": "[점수 부여 이유]",
        "physiognomy_compatibility": "[관상 궁합]",
        "saju_compatibility": "[사주 궁합]",
        "integrated_summary": "[갈등/조화 포인트 + 관계 유지 조언]"
      }
    }`
  }
  // 영문 및 다른 언어 번역 생략
};


// 헬퍼 함수들
const getBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = (error) => reject(error);
});

const uploadImageToStorage = async (file) => {
  if (!storage || !file) return null;
  const fileName = `face-images/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, fileName);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};

const useCountUp = (end, duration = 1500) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (typeof end !== 'number') { setCount(0); return; }
    let frame = 0;
    const totalFrames = Math.round(duration / (1000 / 60));
    const counter = setInterval(() => {
      frame++;
      const progress = 1 - Math.pow(1 - (frame / totalFrames), 3);
      const currentCount = Math.round(end * progress);
      setCount(currentCount);
      if (frame === totalFrames) {
        clearInterval(counter);
      }
    }, 1000 / 60);
    return () => clearInterval(counter);
  }, [end, duration]);
  return count;
};


// --- 신규 컴포넌트 ---

// 사용자 입력을 받는 통합 컴포넌트
const InputSection = ({ personNum, title, onImageSelect, onDobChange, previewImage, dob, strings }) => {
    const [isDragging, setIsDragging] = useState(false);
    
    const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e) => {
      e.preventDefault(); e.stopPropagation(); setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files && files.length > 0) onImageSelect(files[0], personNum);
    };
    const handleFileChange = (e) => {
      const files = e.target.files;
      if (files && files.length > 0) onImageSelect(files[0], personNum);
    };

    const borderColor = personNum === 1 ? 'border-rose-300 hover:border-rose-500' : 'border-fuchsia-300 hover:border-fuchsia-500';
    const draggingBorderColor = personNum === 1 ? 'border-rose-600' : 'border-fuchsia-600';
    const bgColor = personNum === 1 ? 'bg-rose-50/50' : 'bg-fuchsia-50/50';
    const draggingBgColor = personNum === 1 ? 'bg-rose-100' : 'bg-fuchsia-100';
    const buttonColor = personNum === 1 ? 'bg-rose-500 hover:bg-rose-600' : 'bg-fuchsia-500 hover:bg-fuchsia-600';
  
    return (
        <div 
            onDragEnter={handleDragEnter} 
            onDragLeave={handleDragLeave} 
            onDragOver={handleDragOver} 
            onDrop={handleDrop}
            className={`w-full border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 flex flex-col items-center justify-between ${borderColor} ${bgColor} ${isDragging ? `${draggingBorderColor} ${draggingBgColor} scale-105` : ''}`}
        >
            <h2 className="text-2xl font-bold mb-3 font-gaegu">{title}</h2>
            
            {/* 사진 업로드 */}
            <div className="relative mb-4">
                <img src={previewImage} alt={`${title}`} className="w-40 h-40 md:w-48 md:h-48 object-cover mx-auto rounded-full shadow-xl border-4 border-white" onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x400/e2e8f0/cbd5e0?text=Error`; }} />
                <label htmlFor={`person${personNum}ImageUpload`} className={`absolute bottom-0 right-0 cursor-pointer p-2 rounded-full shadow-lg transition-transform transform hover:scale-110 ${buttonColor}`}>
                    <UploadCloudIcon className="w-6 h-6 text-white" />
                </label>
                <input type="file" id={`person${personNum}ImageUpload`} accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
            <p className="text-sm font-bold text-indigo-600 mb-4" dangerouslySetInnerHTML={{ __html: strings.uploadInstruction }}></p>
            
            {/* 생년월일 입력 */}
            <div className="w-full max-w-xs">
                <label htmlFor={`dob${personNum}`} className="font-bold text-gray-700 mb-1 flex items-center justify-center font-gaegu">
                    <CalendarIcon className="w-5 h-5 mr-2" />{strings.dobLabel}
                </label>
                {/* *** FIX: 생년월일 입력 방식을 text로 변경 *** */}
                <input 
                    type="text"
                    id={`dob${personNum}`}
                    value={dob}
                    onChange={(e) => onDobChange(e.target.value, personNum)}
                    className="w-full p-2 border border-gray-300 rounded-md text-center shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={strings.dobPlaceholder}
                    maxLength="10"
                />
            </div>
        </div>
    );
};


// 로딩 화면 컴포넌트
const AnalysisLoadingComponent = ({ images, strings }) => {
  const [comment, setComment] = useState(strings.loadingComments[0]);
  useEffect(() => {
    const commentInterval = setInterval(() => {
      setComment(strings.loadingComments[Math.floor(Math.random() * strings.loadingComments.length)]);
    }, 2500);
    return () => clearInterval(commentInterval);
  }, [strings.loadingComments]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 p-4 font-gaegu">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl text-center max-w-md w-full">
        <h3 className="text-2xl font-bold text-purple-600 mb-4">운명의 비밀을 푸는 중...</h3>
        
        <img
          src={`https://placehold.co/320x100/dedede/777777?text=${strings.adPlaceholderBannerText.replace(/\+/g, '%20')}`}
          alt="Ad Placeholder"
          className="mx-auto rounded-md shadow-md mb-6"
        />

        <div className="relative w-full max-w-xs mx-auto flex items-center justify-center mb-4">
            <img src={images[0]} alt="Person 1" className="w-24 h-24 object-cover rounded-full shadow-lg border-4 border-rose-400 animate-pulse" />
            {images.length > 1 && (
                <>
                    <HeartIcon className="w-10 h-10 text-red-400 absolute animate-ping" filled={true}/>
                    <img src={images[1]} alt="Person 2" className="w-24 h-24 object-cover rounded-full shadow-lg border-4 border-fuchsia-400 animate-pulse ml-12" />
                </>
            )}
        </div>

        <div className="text-center text-gray-800">
          <p className="text-lg h-12 flex items-center justify-center transition-opacity duration-500">"{comment}"</p>
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto animate-spin mt-2"></div>
          <p className="text-purple-600 mt-2 font-semibold">{strings.loadingMessage}</p>
        </div>
      </div>
    </div>
  );
};


// --- 메인 앱 컴포넌트 ---
const App = () => {
    const getInitialLanguage = useCallback(() => (typeof window !== 'undefined' && translations[window.navigator.language?.split('-')[0]]) ? window.navigator.language.split('-')[0] : 'ko', []);
    
    // --- 상태 관리 ---
    const [language, setLanguage] = useState(getInitialLanguage);
    const [currentStrings, setCurrentStrings] = useState(translations[language]);
    const [pageState, setPageState] = useState('main'); // main, result
  
    // 입력 정보
    const [showCoupleInput, setShowCoupleInput] = useState(false);
    const [person1ImageFile, setPerson1ImageFile] = useState(null);
    const [person1ImagePreview, setPerson1ImagePreview] = useState(`https://placehold.co/400x400/e2e8f0/cbd5e0?text=Person+1`);
    const [person1Dob, setPerson1Dob] = useState('');
    const [person2ImageFile, setPerson2ImageFile] = useState(null);
    const [person2ImagePreview, setPerson2ImagePreview] = useState(`https://placehold.co/400x400/e9d5ff/a855f7?text=Person+2`);
    const [person2Dob, setPerson2Dob] = useState('');

    // 결과 및 로딩
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [resultId, setResultId] = useState(null);
    const [copyStatus, setCopyStatus] = useState('');


    // --- useEffect 훅 ---
    // 언어 변경 시 텍스트 업데이트
    useEffect(() => {
        setCurrentStrings(translations[language]);
    }, [language]);

    // URL 경로에 따라 결과 페이지 로드
    useEffect(() => {
        const path = window.location.pathname.split('/');
        if (path[1] === 'result' && path[2]) {
            const id = path[2];
            setIsLoading(true);
            const fetchResult = async () => {
                if (!db) { setTimeout(fetchResult, 300); return; }
                try {
                    const docRef = doc(db, "results", id);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setLanguage(data.language || 'ko');
                        setAnalysisResult(data.analysis);
                        setPerson1ImagePreview(data.images.person1);
                        if (data.images.person2) {
                            setPerson2ImagePreview(data.images.person2);
                            setShowCoupleInput(true);
                        }
                        setResultId(id);
                        setPageState('result');
                    } else {
                        setError(translations[getInitialLanguage()].resultNotFound);
                        setPageState('main');
                    }
                } catch (e) {
                    console.error("Error fetching result:", e);
                    setError(translations[getInitialLanguage()].resultNotFound);
                    setPageState('main');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchResult();
        }
    }, [getInitialLanguage]);


    // --- 함수 ---
    const handleImageChange = (file, personNum) => {
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            if (personNum === 1) {
                setPerson1ImageFile(file);
                setPerson1ImagePreview(previewUrl);
            } else {
                setPerson2ImageFile(file);
                setPerson2ImagePreview(previewUrl);
            }
            setError('');
        }
    };

    const handleDobChange = (date, personNum) => {
        // 자동 하이픈 추가
        const cleaned = ('' + date).replace(/\D/g, '');
        let match = cleaned.match(/^(\d{4})(\d{2})?(\d{2})?$/);
        let formattedDate = '';
        if (match) {
            formattedDate = match[1] + (match[2] ? '-' + match[2] : '') + (match[3] ? '-' + match[3] : '');
        } else {
            formattedDate = date;
        }

        if (personNum === 1) {
            setPerson1Dob(formattedDate);
        } else {
            setPerson2Dob(formattedDate);
        }
        setError('');
    };

    const resetAllStates = () => {
        window.history.pushState({}, '', '/');
        setShowCoupleInput(false);
        setPerson1ImageFile(null);
        setPerson1ImagePreview(`https://placehold.co/400x400/e2e8f0/cbd5e0?text=Person+1`);
        setPerson1Dob('');
        setPerson2ImageFile(null);
        setPerson2ImagePreview(`https://placehold.co/400x400/e9d5ff/a855f7?text=Person+2`);
        setPerson2Dob('');
        setAnalysisResult(null);
        setError('');
        setIsLoading(false);
        setPageState('main');
        setResultId(null);
    };

    const handleAnalysis = async () => {
        // 유효성 검사
        if (!person1ImageFile || !person1Dob || (showCoupleInput && (!person2ImageFile || !person2Dob))) {
            setError(currentStrings.errorMessageDefault);
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const isCoupleAnalysis = showCoupleInput;
            const prompt = isCoupleAnalysis ? currentStrings.aiPromptCouple : currentStrings.aiPromptSingle;

            const image1Base64 = await getBase64(person1ImageFile);
            
            const parts = [
                { text: prompt },
                { inlineData: { mimeType: person1ImageFile.type, data: image1Base64 } }
            ];

            if (isCoupleAnalysis) {
                const image2Base64 = await getBase64(person2ImageFile);
                parts.push({ inlineData: { mimeType: person2ImageFile.type, data: image2Base64 } });
            }

            const payload = {
                contents: [{ role: "user", parts }],
                generationConfig: { responseMimeType: "application/json" }
            };

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`${currentStrings.apiErrorGeneric}: ${errorData.error?.message || response.statusText}`);
            }

            const result = await response.json();
            if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts[0]) {
                const parsedJson = JSON.parse(result.candidates[0].content.parts[0].text);
                 if (parsedJson.error && parsedJson.error === 'NO_FACE_DETECTED') {
                    throw new Error(currentStrings.noFaceDetectedError);
                }
                setAnalysisResult(parsedJson);

                // Firestore에 결과 저장
                if (db && storage) {
                    const person1URL = await uploadImageToStorage(person1ImageFile);
                    const person2URL = isCoupleAnalysis ? await uploadImageToStorage(person2ImageFile) : null;
                    
                    const docRef = doc(collection(db, "results"));
                    await setDoc(docRef, { 
                        analysis: parsedJson, 
                        images: { person1: person1URL, person2: person2URL },
                        language: language, 
                        createdAt: serverTimestamp() 
                    });
                    const newId = docRef.id;
                    setResultId(newId);
                    window.history.pushState({}, '', `/result/${newId}`);
                }
                setPageState('result');

            } else {
                throw new Error(currentStrings.apiErrorResponseFormat);
            }
        } catch (err) {
            console.error('분석 또는 저장 중 오류 발생:', err);
            setError(`${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopyToClipboard = () => {
        if (!resultId) return;
        const shareUrl = `${window.location.origin}/result/${resultId}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
          setCopyStatus(currentStrings.copySuccessMessage);
          setTimeout(() => setCopyStatus(''), 2000);
        });
    };
    
    // 광고 컴포넌트
    const RegularAdPlaceholder = () => (<div className="my-6 p-3 bg-gray-100 rounded-lg text-center border border-gray-300"><p className="text-gray-600 text-xs">{currentStrings.adPlaceholderBannerText}</p><img src={`https://placehold.co/300x100/e0e0e0/757575?text=${currentStrings.adPlaceholderBannerText.replace(/\s/g, '+')}`} alt="Ad Banner" className="mx-auto mt-1 rounded" /></div>);


    // --- 렌더링 컴포넌트 ---
    const MainPageComponent = () => (
        <div className="font-gowun">
            <section className="mb-8 p-4 bg-indigo-50 rounded-lg shadow">
                <h3 className="text-xl font-bold text-indigo-700 mb-2 text-center font-gaegu">{currentStrings.physiognomyIntroTitle}</h3>
                <p className="text-sm text-gray-600 leading-relaxed text-center">{currentStrings.physiognomyIntroText}</p>
            </section>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 items-start">
                <InputSection personNum={1} title={currentStrings.person1Title} onImageSelect={handleImageChange} onDobChange={handleDobChange} previewImage={person1ImagePreview} dob={person1Dob} strings={currentStrings} />
                <div className={`transition-all duration-500 ease-in-out ${showCoupleInput ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
                    {showCoupleInput ? (
                       <InputSection personNum={2} title={currentStrings.person2Title} onImageSelect={handleImageChange} onDobChange={handleDobChange} previewImage={person2ImagePreview} dob={person2Dob} strings={currentStrings} />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center bg-gray-50/50 rounded-lg p-6 border-2 border-dashed border-gray-300">
                           <button onClick={() => setShowCoupleInput(true)} className="px-6 py-4 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-bold text-lg rounded-lg shadow-lg transition-transform transform hover:scale-105 font-gaegu flex items-center">
                                <PlusCircleIcon className="w-6 h-6 mr-2" />
                                {currentStrings.addCoupleButton}
                           </button>
                        </div>
                    )}
                </div>
            </div>

            {showCoupleInput && (
              <div className="text-center mb-6">
                <button onClick={() => setShowCoupleInput(false)} className="text-sm text-gray-500 hover:text-red-500 font-gaegu">{currentStrings.removeCoupleButton}</button>
              </div>
            )}
            
            <RegularAdPlaceholder />

            <section className="text-center mt-6">
                <button onClick={handleAnalysis} className="px-12 py-5 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold text-2xl rounded-lg shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 font-gaegu">
                    <SparklesIcon className="inline-block w-8 h-8 mr-2" />
                    {showCoupleInput ? currentStrings.analyzeButtonCouple : currentStrings.analyzeButtonSingle}
                </button>
            </section>
        </div>
    );

    const ResultPageComponent = () => {
        const isCouple = analysisResult.analysis_type === 'couple';
        const [activeTab, setActiveTab] = useState(isCouple ? 'compatibility' : 'person1');
        const animatedScore = useCountUp(isCouple ? analysisResult.compatibility?.score : 0);
        
        const renderAnalysisSection = (title, content) => (
            <div className="mb-6 p-4 bg-white/70 rounded-lg shadow-inner">
                <h4 className="text-2xl font-bold text-indigo-700 mb-3 font-gaegu">{title}</h4>
                <p className="text-md leading-relaxed whitespace-pre-line">{content || "분석 결과가 없습니다."}</p>
            </div>
        );

        if (isCouple) {
            const { person1_analysis, person2_analysis, compatibility } = analysisResult;
            const tabs = [
                { id: 'compatibility', label: currentStrings.tabCompatibility },
                { id: 'person1', label: currentStrings.tabPerson1 },
                { id: 'person2', label: currentStrings.tabPerson2 }
            ];
            return (
                <div className="font-gowun">
                    <h2 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 mb-6 font-gaegu">{currentStrings.resultTitleCouple}</h2>
                    <div className="flex justify-center mb-6">
                        <img src={person1ImagePreview} alt="Person 1" className="w-32 h-32 object-cover rounded-full shadow-lg border-4 border-rose-300 -mr-4 z-10"/>
                        <img src={person2ImagePreview} alt="Person 2" className="w-32 h-32 object-cover rounded-full shadow-lg border-4 border-fuchsia-300"/>
                    </div>
                    
                    <div className="border-b border-gray-200 mb-4">
                        <nav className="-mb-px flex justify-center space-x-4" aria-label="Tabs">
                            {tabs.map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`${activeTab === tab.id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg font-gaegu`}>
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <RegularAdPlaceholder />
                    
                    <div>
                         {activeTab === 'compatibility' && compatibility && (
                             <div className="bg-gradient-to-br from-indigo-100 to-blue-200 p-6 rounded-xl shadow-xl border-2 border-indigo-300">
                                <h3 className="text-3xl font-bold text-indigo-700 mb-4 text-center font-gaegu">{currentStrings.compatibilityTitle}</h3>
                                <p className="text-5xl md:text-6xl font-bold text-indigo-600 mb-2 text-center font-gaegu">{animatedScore}{currentStrings.scoreUnit}</p>
                                <p className="text-md text-gray-700 mb-6 italic text-center p-2 bg-white/50 rounded-md">{compatibility.score_reason}</p>
                                {renderAnalysisSection('관상 궁합', compatibility.physiognomy_compatibility)}
                                {renderAnalysisSection('사주 궁합', compatibility.saju_compatibility)}
                                {renderAnalysisSection('최종 궁합 조언', compatibility.integrated_summary)}
                            </div>
                        )}
                        {activeTab === 'person1' && person1_analysis && (
                            <div>
                                {renderAnalysisSection(currentStrings.sectionPhysiognomy, person1_analysis.physiognomy_analysis)}
                                {renderAnalysisSection(currentStrings.sectionSaju, person1_analysis.saju_analysis)}
                            </div>
                        )}
                        {activeTab === 'person2' && person2_analysis && (
                            <div>
                                {renderAnalysisSection(currentStrings.sectionPhysiognomy, person2_analysis.physiognomy_analysis)}
                                {renderAnalysisSection(currentStrings.sectionSaju, person2_analysis.saju_analysis)}
                            </div>
                        )}
                    </div>
                </div>
            );
        } else { // Single person result
            const { person_analysis } = analysisResult;
            return (
                <div className="font-gowun">
                    <h2 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-cyan-500 to-blue-600 mb-6 font-gaegu">{currentStrings.resultTitleSingle}</h2>
                     <div className="flex justify-center mb-6">
                        <img src={person1ImagePreview} alt="Person 1" className="w-40 h-40 object-cover rounded-full shadow-lg border-4 border-cyan-300"/>
                    </div>
                    <RegularAdPlaceholder />
                    {person_analysis && (
                        <>
                           {renderAnalysisSection(currentStrings.sectionPhysiognomy, person_analysis.physiognomy_analysis)}
                           {renderAnalysisSection(currentStrings.sectionSaju, person_analysis.saju_analysis)}
                           {renderAnalysisSection(currentStrings.sectionIntegrated, person_analysis.integrated_analysis)}
                        </>
                    )}
                </div>
            )
        }
    };
    
    // 최종 렌더링
    return (
        <div className="relative min-h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 p-4 sm:p-6 lg:p-8 flex flex-col items-center">
            {/* *** FIX: 로딩 시 뒷 배경 반투명 처리 *** */}
            {isLoading && <AnalysisLoadingComponent images={showCoupleInput ? [person1ImagePreview, person2ImagePreview] : [person1ImagePreview]} strings={currentStrings} />}

            <div className={`w-full transition-all duration-500 ${isLoading ? 'opacity-50 blur-sm pointer-events-none' : 'opacity-100'}`}>
                <header className="w-full max-w-4xl mt-16 sm:mt-12 mb-8 text-center font-gaegu">
                    <h1 className="text-5xl sm:text-6xl font-bold text-white py-2 flex items-center justify-center drop-shadow-lg">
                        {showCoupleInput ? <UsersIcon className="inline-block w-12 h-12 mr-3 text-pink-300" /> : <UserIcon className="inline-block w-12 h-12 mr-3 text-cyan-300" />}
                        {currentStrings.appTitle}
                    </h1>
                    <p className="text-xl text-white mt-3 drop-shadow-md">{currentStrings.appSubtitle}</p>
                </header>
                
                <main className="w-full max-w-4xl bg-white/95 backdrop-blur-md shadow-2xl rounded-xl p-6 sm:p-8">
                    {pageState === 'main' && <MainPageComponent />}
                    {pageState === 'result' && analysisResult && 
                        <div>
                            <ResultPageComponent />
                            <div className="mt-10 pt-6 border-t border-gray-300 flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button onClick={handleCopyToClipboard} disabled={!resultId} className="flex items-center justify-center px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg shadow-lg transition-colors disabled:bg-gray-400 font-gaegu">
                                    <LinkIcon className="w-5 h-5 mr-2" /> {currentStrings.copyButton}
                                </button>
                                <button onClick={resetAllStates} className="flex items-center justify-center px-8 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg shadow-lg transition-colors text-lg font-gaegu">
                                    <RefreshCwIcon className="w-6 h-6 mr-3" /> {currentStrings.retryButton}
                                </button>
                            </div>
                            {copyStatus && <p className="text-center text-md text-green-700 mt-4 font-semibold animate-bounce">{copyStatus}</p>}
                        </div>
                    }

                    {error && <p className="text-red-500 bg-red-100 border border-red-300 rounded-md p-4 text-md mt-4 max-w-md mx-auto shadow-md animate-shake text-center font-bold">{error}</p>}
                </main>

                <footer className="w-full max-w-4xl mt-12 text-center">
                    <p className="text-md text-white/90 drop-shadow-sm">© {new Date().getFullYear()} AI 관상 & 궁합. Just for Fun!</p>
                </footer>
            </div>
        </div>
    );
};

export default App;
