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
const ClipboardCopyIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>);

// 다국어 텍스트 객체
const translations = {
  ko: {
    languageName: "한국어",
    appTitle: "AI 관상 & 궁합", appSubtitle: "사진과 생년월일로 AI가 당신의 운명을 분석해드려요!",
    physiognomyIntroTitle: "✨ '관상'과 '사주'란?", physiognomyIntroText: "'관상'은 얼굴로, '사주'는 태어난 시간으로 사람의 운명을 해석하는 동양의 지혜입니다. 이 앱은 AI 기술을 활용해 이 둘을 재미있게 분석해 드립니다. 과학적 근거보다는 유쾌한 해석에 집중해주세요!",
    person1Title: "분석할 분", person2Title: "궁합 볼 상대",
    uploadInstruction: "얼굴이 선명한 정면 사진을 올려주세요.",
    dobLabel: "생년월일", dobPlaceholder: "YYYY-MM-DD",
    addCoupleButton: "+ 다른사람과 궁합보기", removeCoupleButton: "x 혼자 보기",
    analyzeButtonPersonalized: "AI 맞춤 운명 분석",
    analyzeButtonCouple: "AI 커플 궁합 분석",
    loadingMessage: "운명의 비밀을 푸는 중...",
    errorMessageDefault: "사진과 생년월일을 모두 입력해주세요.",
    noFaceDetectedError: "앗, 사진에서 얼굴을 찾기 어려워요! 😅 이목구비가 선명하게 나온 정면 사진으로 다시 시도해주시면 더 정확한 관상을 볼 수 있답니다.",
    apiErrorGeneric: "API 요청에 실패했습니다", 
    apiErrorResponseFormat: "AI가 응답을 준비하지 못했어요. 😥 응답 형식이 올바르지 않습니다. 잠시 후 다시 시도해주세요!",
    resultTitleSingle: "✨ AI 개인 맞춤 운명 분석 ✨", resultTitleCouple: "💖 AI 커플 궁합 결과 💖",
    retryButton: "처음부터 다시하기",
    copyButton: "공유 링크 복사", copySuccessMessage: "공유 링크가 복사되었어요!",
    resultNotFound: "앗! 해당 결과를 찾을 수 없어요.",
    resultLoading: "운명의 기록을 불러오고 있느니라...",
    loadingComments: [
        "흠... 천지의 기운을 읽고 있느니라... 잠시 숨을 고르거라.",
        "그대의 얼굴에서 운명의 강이 흐르는 것을 보고 있노라.",
        "별들의 속삭임과 그대의 사주를 맞추어 보는 중... ✨",
        "마음의 창인 눈빛에서 과거와 미래를 엿보고 있느니라.",
        "하늘의 뜻을 그대의 얼굴에 비추어 보고 있으니, 곧 알게 되리라."
    ],
    adPlaceholderBannerText: "꿀잼 광고 배너",
    aiPromptSingle: `당신은 30년 경력의 저명한 관상가이자 사주 명리학의 대가입니다. 사용자의 사진(관상)과 생년월일(사주)을 종합하여, 실제 점집에서 1:1로 깊이 있는 상담을 해주는 것처럼 운세 풀이를 제공해야 합니다. 친근하면서도 신비로운 전문가의 말투를 사용해주세요.

    **[분석 목표]**
    - 사용자가 자신의 삶에 대한 깊은 통찰과 재미를 얻고, 결과에 완전히 몰입하게 만들어야 합니다.
    - 분석 내용은 반드시 구체적이고, 사용자가 "어떻게 알았지?"라고 생각할 만큼 현실적인 사건들을 포함해야 합니다.

    **[분석 지침 및 순서]**
    1.  **첫인상 및 기운 (first_impression)**: "어? 이 분은 정말 특별한 기운을 가지고 있네요!" 와 같이 사용자의 호기심을 자극하는 강력한 한마디로 시작하세요. 관상과 사주에서 느껴지는 전체적인 기운과 첫인상을 날카롭게 묘사해주세요.
    2.  **성격 심층 분석 (personality_analysis)**: 관상을 중심으로 사주를 결합하여 진짜 성격을 분석합니다.
        -   \`face_shape\`: 얼굴형과 전체적인 조화
        -   \`forehead\`: 이마 (초년운, 지혜)
        -   \`eyes\`: 눈 (마음의 창, 대인관계)
        -   \`nose\`: 코 (재물운, 자존심)
        -   \`mouth\`: 입과 턱 (말년운, 의지)
        -   \`summary\`: 모든 것을 종합한 성격의 핵심 요약.
    3.  **과거 흐름 검증 (past_verification)**: 사용자의 신뢰를 얻기 위해 과거의 중요한 시점을 짚어주세요.
        -   \`period_2018_2019\`: 2018-2019년 시기의 환경 변화, 도전, 기회 등을 분석.
        -   \`period_2020_2021\`: 2020-2021년 시기의 어려움, 인내, 성장의 과정을 분석.
        -   \`recent_years\`: 최근 2-3년간의 운세 흐름과 주요 이슈 분석.
    4.  **핵심 운세 분석**:
        -   \`wealth_career\`: 재물운과 직업운의 흐름, 성공 가능성, 피해야 할 것들.
        -   \`love_marriage\`: 연애운과 결혼운, 좋은 인연을 만나는 시기, 관계 조언.
    5.  **미래 전망 및 조언**:
        -   \`future_fortune\`: 2024년 하반기부터 2025년까지의 구체적인 월별 운세와 기회.
        -   \`advice_caution\`: 인생 전반에 걸쳐 주의해야 할 점과 운을 좋게 만드는 개운법.
    6.  **운세 요약 및 키워드**:
        -   \`summary_table\`: 재물, 연애, 건강, 직업, 관계 5개 항목에 대해 1~5점 척도로 점수를 매기고, 짧은 설명을 덧붙여주세요.
        -   \`keywords\`: 사용자의 인생을 대표하는 핵심 키워드 4개를 제시해주세요.

    **[JSON 응답 형식]**
    반드시 아래의 JSON 구조를 완벽하게 준수하여 응답해야 합니다. 다른 텍스트는 절대 포함하지 마세요.
    {
      "analysis_type": "single",
      "result": {
        "title": "🔮 사주팔자 + 관상 종합 운세 풀이",
        "birth_info": "YYYY년 MM월 DD일생",
        "first_impression": "...",
        "personality_analysis": {
          "face_shape": "...", "forehead": "...", "eyes": "...", "nose": "...", "mouth": "...", "summary": "..."
        },
        "past_verification": {
          "period_2018_2019": "...", "period_2020_2021": "...", "recent_years": "..."
        },
        "wealth_career": "...",
        "love_marriage": "...",
        "future_fortune": "...",
        "advice_caution": "...",
        "summary_table": {
          "wealth": { "score": 4, "description": "안정적이고 꾸준함" },
          "love": { "score": 3, "description": "2027년 이후 상승" },
          "health": { "score": 3, "description": "소화기 주의 필요" },
          "career": { "score": 4, "description": "전문성 발휘 시기" },
          "relationship": { "score": 3, "description": "선택적 관계 유지" }
        },
        "keywords": ["완벽주의자", "늦은 성공", "안정적 재물", "깊은 사랑"]
      }
    }`,
    aiPromptCouple: `당신은 30년 경력의 관계 전문 점술가입니다. 두 사람의 사진(관상)과 생년월일(사주)을 통해, 실제 커플 상담을 하듯 깊이 있고 재미있게 궁합을 분석해주세요. 친근하면서도 핵심을 찌르는 말투를 사용해주세요.

    **[분석 목표]**
    - 두 사람의 관계에 대한 명확한 통찰을 제공하고, 관계 개선을 위한 실질적인 조언을 통해 재미와 감동을 선사해야 합니다.

    **[분석 지침]**
    1.  **개별 분석**: 각 사람의 관상과 사주를 간략하게 분석하여 어떤 사람인지 설명해주세요.
    2.  **궁합 종합 분석**:
        -   \`total_score\`: 궁합 점수를 100점 만점으로 매기고, 그 이유를 재미있게 설명해주세요.
        -   \`physiognomy_match\`: 얼굴의 조화, 서로에게 미치는 영향 등 관상 궁합을 분석합니다.
        -   \`saju_match\`: 사주 오행의 조화, 성격의 상생 또는 상극 관계를 분석합니다.
        -   \`relationship_advice\`: 두 사람이 더 행복해지기 위한 구체적이고 현실적인 연애 조언을 2~3가지 제시해주세요.

    **[JSON 응답 형식]**
    반드시 아래의 JSON 구조를 완벽하게 준수하여 응답해야 합니다. 다른 텍스트는 절대 포함하지 마세요.
    {
      "analysis_type": "couple",
      "result": {
        "title": "💖 AI 커플 궁합 결과 💖",
        "person1": {
          "nickname": "첫 번째 분 별명", "physiognomy": "관상 분석...", "saju": "사주 분석..."
        },
        "person2": {
          "nickname": "두 번째 분 별명", "physiognomy": "관상 분석...", "saju": "사주 분석..."
        },
        "compatibility": {
          "total_score": 85,
          "score_reason": "두 분은 마치...",
          "physiognomy_match": "관상으로 볼 때...",
          "saju_match": "사주 상으로는...",
          "relationship_advice": "서로에게..."
        }
      }
    }`
  }
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


const DobInput = React.memo(({ value, onChange, placeholder }) => {
    const handleChange = (e) => {
        const rawValue = e.target.value;
        const cleaned = rawValue.replace(/\D/g, '');
        let formatted = cleaned;
        if (cleaned.length > 4) {
            formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
        }
        if (cleaned.length > 6) {
            formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
        }
        onChange(formatted);
    };

    return (
        <input 
            type="text"
            value={value}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md text-center shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder={placeholder}
            maxLength="10"
        />
    );
});


const InputSection = React.memo(({ personNum, title, onImageSelect, onDobChange, previewImage, dob, strings }) => {
    const [isDragging, setIsDragging] = useState(false);
    
    const handleDragEnter = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
    const handleDragOver = useCallback((e) => { e.preventDefault(); e.stopPropagation(); }, []);
    
    const handleDrop = useCallback((e) => {
      e.preventDefault(); e.stopPropagation();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        onImageSelect(files[0], personNum);
      }
    }, [onImageSelect, personNum]);

    const handleFileChange = useCallback((e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onImageSelect(files[0], personNum);
      }
    }, [onImageSelect, personNum]);
    
    const handleDobChangeCallback = useCallback((val) => {
        onDobChange(val, personNum);
    }, [onDobChange, personNum]);

    const borderColor = personNum === 1 ? 'border-rose-300 hover:border-rose-500' : 'border-fuchsia-300 hover:border-fuchsia-500';
    const bgColor = personNum === 1 ? 'bg-rose-50/50' : 'bg-fuchsia-50/50';
    const buttonColor = personNum === 1 ? 'bg-rose-500 hover:bg-rose-600' : 'bg-fuchsia-500 hover:bg-fuchsia-600';
  
    return (
        <div 
            onDragEnter={handleDragEnter} 
            onDragLeave={handleDragLeave} 
            onDragOver={handleDragOver} 
            onDrop={handleDrop}
            className={`w-full h-full border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 flex flex-col items-center justify-between ${borderColor} ${bgColor} ${isDragging ? 'scale-105' : ''}`}
        >
            <h2 className="text-2xl font-bold mb-3 font-gaegu">{title}</h2>
            
            <div className="relative mb-4">
                <img src={previewImage} alt={`${title}`} className="w-40 h-40 md:w-48 md:h-48 object-cover mx-auto rounded-full shadow-xl border-4 border-white" onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x400/e2e8f0/cbd5e0?text=Error`; }} />
                <label htmlFor={`person${personNum}ImageUpload`} className={`absolute bottom-0 right-0 cursor-pointer p-2 rounded-full shadow-lg transition-transform transform hover:scale-110 ${buttonColor}`}>
                    <UploadCloudIcon className="w-6 h-6 text-white" />
                </label>
                <input type="file" id={`person${personNum}ImageUpload`} accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
            <p className="text-sm font-bold text-indigo-600 mb-4" dangerouslySetInnerHTML={{ __html: strings.uploadInstruction }}></p>
            
            <div className="w-full max-w-xs">
                <label className="font-bold text-gray-700 mb-1 flex items-center justify-center font-gaegu">
                    <CalendarIcon className="w-5 h-5 mr-2" />{strings.dobLabel}
                </label>
                <DobInput
                    value={dob}
                    onChange={handleDobChangeCallback}
                    placeholder={strings.dobPlaceholder}
                />
            </div>
        </div>
    );
});


const AnalysisLoadingComponent = React.memo(({ images, strings, loadingText }) => {
  const [comment, setComment] = useState(strings.loadingComments[0]);
  const isFetching = loadingText === strings.resultLoading;

  useEffect(() => {
    if (isFetching) return;
    const commentInterval = setInterval(() => {
      setComment(strings.loadingComments[Math.floor(Math.random() * strings.loadingComments.length)]);
    }, 2500);
    return () => clearInterval(commentInterval);
  }, [strings.loadingComments, isFetching]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 p-4 font-gaegu">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl text-center max-w-md w-full">
        <h3 className="text-2xl font-bold text-purple-600 mb-4">{loadingText}</h3>
        
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
          {!isFetching && <p className="text-lg h-12 flex items-center justify-center transition-opacity duration-500">"{comment}"</p>}
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto animate-spin mt-2"></div>
        </div>
      </div>
    </div>
  );
});

const MainPageComponent = React.memo(({
    currentStrings,
    handleAnalysis,
    handleImageChange,
    handleDobChange,
    person1ImagePreview,
    person1Dob,
    person2ImagePreview,
    person2Dob,
    showCoupleInput,
    setShowCoupleInput,
    person1ImageFile,
    person2ImageFile
}) => (
    <div className="font-gowun">
        <section className="mb-8 p-4 bg-indigo-50 rounded-lg shadow">
            <h3 className="text-xl font-bold text-indigo-700 mb-2 text-center font-gaegu">{currentStrings.physiognomyIntroTitle}</h3>
            <p className="text-sm text-gray-600 leading-relaxed text-center">{currentStrings.physiognomyIntroText}</p>
        </section>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 items-stretch">
            <InputSection personNum={1} title={currentStrings.person1Title} onImageSelect={handleImageChange} onDobChange={handleDobChange} previewImage={person1ImagePreview} dob={person1Dob} strings={currentStrings} />
            <div className="w-full h-full">
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
        
        <div className="my-6 p-3 bg-gray-100 rounded-lg text-center border border-gray-300"><p className="text-gray-600 text-xs">{currentStrings.adPlaceholderBannerText}</p><img src={`https://placehold.co/300x100/e0e0e0/757575?text=${currentStrings.adPlaceholderBannerText.replace(/\s/g, '+')}`} alt="Ad Banner" className="mx-auto mt-1 rounded" /></div>

        <section className="text-center mt-6">
            <button 
                onClick={handleAnalysis} 
                disabled={
                    !person1ImageFile || !person1Dob || 
                    (showCoupleInput && (!person2ImageFile || !person2Dob))
                }
                className="px-12 py-5 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold text-2xl rounded-lg shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 font-gaegu">
                <SparklesIcon className="inline-block w-8 h-8 mr-2" />
                {showCoupleInput ? currentStrings.analyzeButtonCouple : currentStrings.analyzeButtonPersonalized}
            </button>
        </section>
    </div>
));


const ResultPageComponent = React.memo(({ analysisResult, person1ImagePreview, person2ImagePreview }) => {
    const { result } = analysisResult;
    const isCouple = analysisResult.analysis_type === 'couple';

    const animatedScore = useCountUp(isCouple ? result.compatibility?.total_score : 0, 2000);

    const renderSection = (title, content, emoji, customClass = '') => (
        content && (
            <div className={`mb-6 p-5 rounded-xl shadow-lg bg-white/80 backdrop-blur-sm border border-gray-200 ${customClass}`}>
                <h3 className="text-2xl font-bold text-indigo-800 mb-3 font-gaegu flex items-center">
                    <span className="text-3xl mr-3">{emoji}</span> {title}
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line font-gowun">{content}</p>
            </div>
        )
    );

    const StarRating = ({ score }) => (
        <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
                <span key={i} className={`text-2xl ${i < score ? 'text-yellow-400' : 'text-gray-300'}`}>⭐</span>
            ))}
        </div>
    );

    if (isCouple) {
        const { person1, person2, compatibility } = result || {};
        return (
            <div className="font-gowun">
                <h2 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 mb-4 font-gaegu">{result?.title || "AI 커플 궁합 결과"}</h2>
                <div className="flex justify-center items-center mb-6 gap-2">
                    <img src={person1ImagePreview} alt="Person 1" className="w-28 h-28 object-cover rounded-full shadow-xl border-4 border-rose-300"/>
                    <HeartIcon className="w-10 h-10 text-red-400" filled={true} />
                    <img src={person2ImagePreview} alt="Person 2" className="w-28 h-28 object-cover rounded-full shadow-xl border-4 border-fuchsia-300"/>
                </div>

                <div className="bg-gradient-to-br from-indigo-100 to-blue-200 p-6 rounded-xl shadow-xl border-2 border-indigo-300 text-center mb-8">
                    <h3 className="text-3xl font-bold text-indigo-700 mb-2 font-gaegu">종합 궁합 점수</h3>
                    <p className="text-6xl font-bold text-indigo-600 my-2 font-gaegu">{animatedScore}점!!!</p>
                    <p className="text-md text-gray-800 italic p-2 bg-white/50 rounded-md">{compatibility?.score_reason}</p>
                </div>

                {renderSection('관상 궁합', compatibility?.physiognomy_match, '🎭')}
                {renderSection('사주 궁합', compatibility?.saju_match, '📜')}
                {renderSection('행복을 위한 조언', compatibility?.relationship_advice, '💡', 'bg-emerald-50 border-emerald-200')}

                <div className="grid md:grid-cols-2 gap-6 mt-8">
                    <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
                        <h4 className="font-bold text-xl text-center mb-2 font-gaegu">{person1?.nickname || "첫 번째 분"}</h4>
                        {renderSection('관상 분석', person1?.physiognomy, '🧐')}
                        {renderSection('사주 분석', person1?.saju, '🗓️')}
                    </div>
                    <div className="p-4 bg-fuchsia-50 rounded-lg border border-fuchsia-200">
                        <h4 className="font-bold text-xl text-center mb-2 font-gaegu">{person2?.nickname || "두 번째 분"}</h4>
                        {renderSection('관상 분석', person2?.physiognomy, '🧐')}
                        {renderSection('사주 분석', person2?.saju, '🗓️')}
                    </div>
                </div>
            </div>
        );
    }
    
    // Single Analysis
    const { title, birth_info, first_impression, personality_analysis, past_verification, wealth_career, love_marriage, future_fortune, advice_caution, summary_table, keywords } = result || {};

    return (
        <div className="font-gowun">
            <h2 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-cyan-500 to-blue-600 mb-2 font-gaegu">{title || "종합 운세 풀이"}</h2>
            <p className="text-center text-gray-600 font-semibold mb-6">{birth_info}</p>
            <div className="flex justify-center mb-6">
                <img src={person1ImagePreview} alt="Analyzed person" className="w-40 h-40 object-cover rounded-full shadow-2xl border-4 border-cyan-300"/>
            </div>

            {renderSection('첫인상 & 기운', first_impression, '💫', 'bg-amber-50 border-amber-200')}
            
            <div className="mb-6 p-5 rounded-xl shadow-lg bg-white/80 backdrop-blur-sm border border-gray-200">
                <h3 className="text-2xl font-bold text-indigo-800 mb-4 font-gaegu flex items-center"><span className="text-3xl mr-3">🎭</span> 진짜 성격 (관상 + 사주)</h3>
                <div className="space-y-3">
                    {Object.entries(personality_analysis || {}).map(([key, value]) => {
                        const titles = { face_shape: '얼굴형', forehead: '이마', eyes: '눈', nose: '코', mouth: '입/턱', summary: '종합' };
                        return <p key={key} className="font-gowun text-gray-700"><strong>{titles[key]}:</strong> {value}</p>;
                    })}
                </div>
            </div>

            {renderSection('과거 돌아보기', 
                Object.entries(past_verification || {}).map(([key, value]) => {
                    const titles = { period_2018_2019: '2018-19년', period_2020_2021: '2020-21년', recent_years: '최근' };
                    return `[${titles[key]}] ${value}`;
                }).join('\n\n'), 
                '🔥')}
            
            {renderSection('재물운 & 직업운', wealth_career, '💰')}
            {renderSection('연애운 & 결혼운', love_marriage, '💕')}
            {renderSection('2024 하반기 ~ 2025년 운세', future_fortune, '🚀')}
            {renderSection('주의사항 & 조언', advice_caution, '⚠️', 'bg-red-50 border-red-200')}

            <div className="mb-6 p-5 rounded-xl shadow-lg bg-white/80 backdrop-blur-sm border border-gray-200">
                <h3 className="text-2xl font-bold text-indigo-800 mb-4 font-gaegu flex items-center"><span className="text-3xl mr-3">📊</span> 운세 요약</h3>
                <div className="space-y-2">
                    {summary_table && Object.entries(summary_table).map(([key, value]) => {
                        const titles = { wealth: '재물운', love: '연애운', health: '건강운', career: '직업운', relationship: '관계운' };
                        return (
                            <div key={key} className="grid grid-cols-3 items-center gap-2">
                                <span className="font-bold text-gray-800">{titles[key]}</span>
                                <StarRating score={value.score} />
                                <span className="text-sm text-gray-600">{value.description}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <h4 className="font-bold font-gaegu text-indigo-700">🎯 핵심 키워드</h4>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {(keywords || []).map((tag, index) => (
                        <span key={index} className="text-sm bg-indigo-200 text-indigo-800 px-3 py-1 rounded-full font-semibold">{tag}</span>
                    ))}
                </div>
            </div>

        </div>
    );
});


// --- 메인 앱 컴포넌트 ---
const App = () => {
    const [language, setLanguage] = useState('ko');
    const [currentStrings, setCurrentStrings] = useState(translations.ko);
    const [pageState, setPageState] = useState('main');
    const [showCoupleInput, setShowCoupleInput] = useState(false);
    const [person1ImageFile, setPerson1ImageFile] = useState(null);
    const [person1ImagePreview, setPerson1ImagePreview] = useState(`https://placehold.co/400x400/e2e8f0/cbd5e0?text=Person+1`);
    const [person1Dob, setPerson1Dob] = useState('');
    const [person2ImageFile, setPerson2ImageFile] = useState(null);
    const [person2ImagePreview, setPerson2ImagePreview] = useState(`https://placehold.co/400x400/e9d5ff/a855f7?text=Person+2`);
    const [person2Dob, setPerson2Dob] = useState('');
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [resultId, setResultId] = useState(null);
    const [copyStatus, setCopyStatus] = useState('');
    const [loadingText, setLoadingText] = useState('');

    useEffect(() => {
        const lang = (typeof window !== 'undefined' && translations[window.navigator.language?.split('-')[0]]) ? window.navigator.language.split('-')[0] : 'ko';
        const validLang = translations[lang] ? lang : 'ko';
        setLanguage(validLang);
        setCurrentStrings(translations[validLang]);
        setLoadingText(translations[validLang].loadingMessage);
    }, []);

    useEffect(() => {
        const path = window.location.pathname.split('/');
        if (path[1] === 'result' && path[2]) {
            const id = path[2];
            setIsLoading(true);
            const fetchResult = async () => {
                if (!db) { setTimeout(fetchResult, 300); return; }
                 const lang = (typeof window !== 'undefined' && translations[window.navigator.language?.split('-')[0]]) ? window.navigator.language.split('-')[0] : 'ko';
                const validLang = translations[lang] ? lang : 'ko';
                setLoadingText(translations[validLang].resultLoading);
                try {
                    const docRef = doc(db, "results", id);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setLanguage(data.language || 'ko');
                        setCurrentStrings(translations[data.language || 'ko']);
                        setAnalysisResult(data.analysis);
                        setPerson1ImagePreview(data.images.person1);
                        if (data.analysis.analysis_type === 'couple') {
                            setPerson2ImagePreview(data.images.person2);
                            setShowCoupleInput(true);
                        }
                        setResultId(id);
                        setPageState('result');
                    } else {
                        setError(translations[validLang].resultNotFound);
                        setPageState('main');
                    }
                } catch (e) {
                    console.error("Error fetching result:", e);
                    setError(translations[validLang].resultNotFound);
                    setPageState('main');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchResult();
        }
    }, []);


    // 함수
    const handleImageChange = useCallback((file, personNum) => {
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            if (personNum === 1) { setPerson1ImageFile(file); setPerson1ImagePreview(previewUrl); }
            if (personNum === 2) { setPerson2ImageFile(file); setPerson2ImagePreview(previewUrl); }
            setError('');
        }
    }, []);

    const handleDobChange = useCallback((date, personNum) => {
        if (personNum === 1) setPerson1Dob(date);
        if (personNum === 2) setPerson2Dob(date);
        setError('');
    }, []);

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

    const handleAnalysis = useCallback(async () => {
        const isCoupleAnalysis = showCoupleInput;
        
        if (!person1ImageFile || !person1Dob || (isCoupleAnalysis && (!person2ImageFile || !person2Dob))) {
            setError(currentStrings.errorMessageDefault);
            return;
        }

        setLoadingText(currentStrings.loadingMessage);
        setIsLoading(true);
        setError('');

        try {
            const prompt = isCoupleAnalysis ? currentStrings.aiPromptCouple : currentStrings.aiPromptSingle.replace("YYYY년 MM월 DD일생", `${person1Dob}생`);
            
            const image1Base64 = await getBase64(person1ImageFile);
            const parts = [{ text: prompt }, { inlineData: { mimeType: person1ImageFile.type, data: image1Base64 } }];

            if (isCoupleAnalysis) {
                const image2Base64 = await getBase64(person2ImageFile);
                parts.push({ inlineData: { mimeType: person2ImageFile.type, data: image2Base64 } });
            }

            const payload = { contents: [{ role: "user", parts }], generationConfig: { responseMimeType: "application/json" } };
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

            if (!response.ok) throw new Error(`${currentStrings.apiErrorGeneric} (${response.status})`);
            
            const result = await response.json();
            
            if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
                 console.error("Invalid API Response:", result);
                 throw new Error(currentStrings.apiErrorResponseFormat);
            }
            
            let parsedJson;
            try {
                 parsedJson = JSON.parse(result.candidates[0].content.parts[0].text);
            } catch(e) {
                 console.error("JSON parsing error:", e);
                 console.error("Raw text from API:", result.candidates[0].content.parts[0].text);
                 throw new Error(currentStrings.apiErrorResponseFormat);
            }

            if (parsedJson.error === 'NO_FACE_DETECTED') throw new Error(currentStrings.noFaceDetectedError);
            
            setAnalysisResult(parsedJson);

            if (db && storage) {
                const person1URL = await uploadImageToStorage(person1ImageFile);
                const person2URL = isCoupleAnalysis ? await uploadImageToStorage(person2ImageFile) : null;
                const docRef = doc(collection(db, "results"));
                await setDoc(docRef, { 
                    analysis: parsedJson, images: { person1: person1URL, person2: person2URL },
                    language: language, createdAt: serverTimestamp() 
                });
                setResultId(docRef.id);
                window.history.pushState({}, '', `/result/${docRef.id}`);
            }
            setPageState('result');
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [showCoupleInput, person1ImageFile, person1Dob, person2ImageFile, person2Dob, currentStrings, language]);
    
    const handleCopyToClipboard = useCallback((textToCopy) => {
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy).then(() => {
          setCopyStatus(currentStrings.copySuccessMessage);
          setTimeout(() => setCopyStatus(''), 2000);
        });
    }, [currentStrings.copySuccessMessage]);
    
    // 최종 렌더링
    return (
        <div className="relative min-h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 p-4 sm:p-6 lg:p-8 flex flex-col">
            {isLoading && <AnalysisLoadingComponent images={showCoupleInput ? [person1ImagePreview, person2ImagePreview] : [person1ImagePreview]} strings={currentStrings} loadingText={loadingText} />}

            <div className={`w-full mx-auto transition-all duration-500 ${isLoading ? 'opacity-50 blur-sm pointer-events-none' : 'opacity-100'}`}>
                <header className="w-full max-w-4xl mx-auto mt-16 sm:mt-12 mb-8 text-center font-gaegu">
                    <h1 className="text-5xl sm:text-6xl font-bold text-white py-2 flex items-center justify-center drop-shadow-lg">
                        {showCoupleInput ? <UsersIcon className="inline-block w-12 h-12 mr-3 text-pink-300" /> : <UserIcon className="inline-block w-12 h-12 mr-3 text-cyan-300" />}
                        {currentStrings.appTitle}
                    </h1>
                    <p className="text-xl text-white mt-3 drop-shadow-md">{currentStrings.appSubtitle}</p>
                </header>
                
                <main className="w-full max-w-4xl mx-auto bg-white/90 backdrop-blur-md shadow-2xl rounded-xl p-6 sm:p-8">
                    {pageState === 'main' && (
                        <MainPageComponent
                            currentStrings={currentStrings}
                            handleAnalysis={handleAnalysis}
                            handleImageChange={handleImageChange}
                            handleDobChange={handleDobChange}
                            person1ImagePreview={person1ImagePreview}
                            person1Dob={person1Dob}
                            person2ImagePreview={person2ImagePreview}
                            person2Dob={person2Dob}
                            showCoupleInput={showCoupleInput}
                            setShowCoupleInput={setShowCoupleInput}
                            person1ImageFile={person1ImageFile}
                            person2ImageFile={person2ImageFile}
                        />
                    )}
                    {pageState === 'result' && analysisResult && 
                        <div>
                            <ResultPageComponent 
                                analysisResult={analysisResult}
                                person1ImagePreview={person1ImagePreview}
                                person2ImagePreview={person2ImagePreview}
                            />
                            <div className="mt-10 pt-6 border-t border-gray-300 flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button onClick={() => handleCopyToClipboard(`${window.location.origin}/result/${resultId}`)} disabled={!resultId} className="flex items-center justify-center px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg shadow-lg transition-colors disabled:bg-gray-400 font-gaegu">
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
                <footer className="w-full max-w-4xl mx-auto mt-12 text-center">
                    <p className="text-md text-white/90 drop-shadow-sm">© {new Date().getFullYear()} AI 관상 & 궁합. Just for Fun!</p>
                </footer>
            </div>
        </div>
    );
};

export default App;
