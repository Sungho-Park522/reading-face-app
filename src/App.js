import React, { useState, useCallback, useEffect, useMemo } from 'react';
// Firebase SDK import
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "firebase/storage";


// ★★★ API 키 설정 영역 ★★★
// Netlify 환경 변수에서 직접 값을 가져옵니다. 로컬 테스트 시에는 이 부분에 직접 키를 넣거나,
// 기능이 동작하지 않는 것을 감안하고 빈 문자열로 둡니다.
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
// Netlify 빌드 과정에서 %REACT_APP_*% 형태의 플레이스홀더가 실제 값으로 치환됩니다.
// 만약 치환되지 않았다면 (로컬 환경 등), 키가 없다고 판단합니다.
const isFirebaseConfigured = Object.values(firebaseConfig).every(v => v && !v.startsWith('%REACT_APP_'));

if (isFirebaseConfigured) {
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
  console.warn("Firebase configuration is missing or invalid. Database features will be disabled.");
}


// 아이콘 정의
const UploadCloudIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m16 16-4-4-4 4"></path></svg>);
const UserIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const LinkIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>);
const RefreshCwIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path></svg>);
const CalendarIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>);
const SparklesIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.9 5.8-5.8 1.9 5.8 1.9 1.9 5.8 1.9-5.8 5.8-1.9-5.8-1.9z"/><path d="M22 12a10 10 0 1 1-10-10"/><path d="M22 12a10 10 0 0 0-10-10"/></svg>);

// 다국어 텍스트 객체
const translations = {
  ko: {
    languageName: "한국어",
    appTitle: "AI 운명 비기(祕記)",
    appSubtitle: "사진과 생년월일, 그리고 당신의 욕망으로 운명의 길을 밝힙니다.",
    interestSelectionTitle: "🎯 가장 절실한 관심사를 1~3개 고르시오.",
    interests: {
        wealth: "💰 재물",
        honor: "🏆 명예",
        love: "💕 사랑",
        health: "🩺 건강",
        career: "🚀 직업운",
        relationships: "👥 인간관계",
        overall: "🔮 총운",
        academics: "📚 학업/시험"
    },
    person1Title: "그대의 정보를",
    uploadInstruction: "가장 최근의 얼굴 사진을 올리시오.",
    dobLabel: "태어난 날",
    dobPlaceholder: "YYYY-MM-DD",
    jobLabel: "직업 (선택)",
    jobPlaceholder: "예: 학생, 개발자, 디자이너",
    analyzeButtonPersonalized: "운명의 길 열어보기",
    loadingMessage: "운명의 수레바퀴를 돌리는 중...",
    errorMessageDefault: "사진, 생년월일, 그리고 관심사를 모두 선택해야 하느니라.",
    apiErrorGeneric: "하늘의 뜻을 읽는 데 실패했다. 잠시 후 다시 시도하게.",
    apiErrorResponseFormat: "천기누설이 너무 심했나. 응답의 형식이 올바르지 않으니, 잠시 후 다시 시도하게.",
    apiErrorDbConnection: "데이터베이스에 연결할 수 없습니다. API 키 설정을 확인하세요.",
    retryButton: "다시 묻기",
    copyButton: "결과 공유",
    copySuccessMessage: "결과 주소가 복사되었느니라!",
    resultNotFound: "해당하는 운명의 기록을 찾을 수 없네.",
    resultLoading: "운명의 기록을 불러오는 중...",
    loadingComments: [
        "흠... 천지의 기운을 읽고 있느니라... 잠시 숨을 고르거라.",
        "그대의 얼굴에서 운명의 강이 흐르는 것을 보고 있노라.",
        "별들의 속삭임과 그대의 사주를 맞추어 보는 중... ✨",
        "마음의 창인 눈빛에서 과거와 미래를 엿보고 있느니라.",
        "하늘의 뜻을 그대의 얼굴에 비추어 보고 있으니, 곧 알게 되리라."
    ],
    adPlaceholderBannerText: "광고 배너",
    // [REVISED] 새로운 AI 프롬프트: 사용자가 제공한 예시 스타일을 완벽히 반영한 서사적 프롬프트
    aiPromptSingle: `당신은 사람의 얼굴과 운명을 꿰뚫어 보는, 날카롭고 직설적인 통찰가입니다. 당신의 말은 위로가 아니라, 듣는 이의 정곡을 찌르는 진단서와 같습니다. 존댓말을 쓰지 말고, 마치 친한 형이나 누나가 비밀스럽게 핵심만 짚어주는 것처럼 반말로 대화하세요. 사용자의 사진(관상), 생년월일(사주), 그리고 다음 정보를 바탕으로 운명을 진단하세요.

- 사용자가 선택한 관심사: {interests}
- 사용자가 입력한 추가 정보: {userInfo}

**[진단 목표]**
- 사용자가 "내 얘기를 어떻게 알았지?"라고 소름 돋게 만들어야 합니다.
- 분석은 하나의 긴 호흡으로 이어지는 이야기여야 하며, 각 파트가 유기적으로 연결되어야 합니다.
- 뻔하고 일반적인 조언 대신, 사용자의 심리를 정확히 파고드는 구체적이고 실행 가능한 지침을 내려야 합니다.

**[진단서 구조 및 지침]**
1.  **정곡 찌르기 (initial_hook)**: 사용자의 얼굴 사진에서 느껴지는 가장 핵심적인 내면의 모순이나 특징을 단번에 꿰뚫는 문장으로 시작하세요. (예시: "니 얼굴 참 묘하네. 밖에서는 웃고 다니는데, 속은 늘 계산하고 있지.")

2.  **과거 회상시키기 (past_validation)**: 그 사용자가 과거에 겪었을 법한, 감정적으로 가장 크게 흔들렸던 경험이나 관계 패턴을 구체적으로 언급하여 신뢰를 구축하세요. (예시: "근데 웃긴 건, 니가 그렇게 철저한 놈인데도 두 번이나, 완전히 뚫린 적이 있어.")

3.  **사주로 본질 분석 (core_analysis)**: 사용자의 생년월일을 바탕으로 사주(일주 등)를 간략히 언급하고, 이를 현대적인 심리 분석으로 알기 쉽게 풀어주세요. 겉모습과 속마음의 차이를 강조하면 좋습니다. (예시: "니 생년 보면... 癸酉일주. 이건 뭐냐면, '겉은 차갑지만 속에는 불씨 하나만 던져도 온몸에 불붙을 사람'이란 뜻이야.")

4.  **미래 시나리오 (future_prophecy)**: 사용자가 선택한 {interests}와 관련하여, 앞으로 2~3년 내에 겪게 될 가장 중요한 사건 하나를 구체적인 시기(예: 2025년 가을)와 함께 생생하게 묘사하세요. 이 사건이 과거의 패턴과 어떻게 연결되는지 반드시 설명해야 합니다. (예시: "근데 문제는, 니가 그런 사람을 올해부터 다시 마주친다는 거야. 2025년 9~11월 사이...")

5.  **생존 지침 (actionable_advice)**: 미래 시나리오를 바탕으로, 사용자가 무엇을 해야 하고, 무엇을 절대 하지 말아야 할지 명확하고 직설적으로 알려주세요. (예시: "사람한테 미련 두지 마. 차라리 새로운 사람 만나라. 운의 핵심은 '니가 움직일 때 생긴다'.")

6.  **마지막 조언 (final_insight)**: 사용자가 평생 안고 가야 할 근본적인 삶의 태도나 내면의 과제를, 가슴에 박히는 문장으로 던지며 마무리하세요. (예시: "너는 '이성적으로 살아왔지만, 결정은 결국 감정이 한다'는 걸 아직 인정 못하고 있어. 이번에는 반대로 해봐.")

**[JSON 응답 형식]**
반드시 아래의 JSON 구조를 완벽하게 준수하여 응답해야 합니다. 모든 내용은 하나의 긴 이야기처럼 연결되어야 합니다.
{
  "title": "📜 운명 진단서: 그대의 얼굴에 새겨진 길",
  "initial_hook": "...",
  "past_validation": "...",
  "core_analysis": "...",
  "future_prophecy": "...",
  "actionable_advice": "...",
  "final_insight": "..."
}`,
  }
};

// Helper Functions
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
    return ( <input type="text" value={value} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md text-center shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder={placeholder} maxLength="10" /> );
});

// Components
const InputSection = React.memo(({ onImageSelect, onDobChange, previewImage, dob, strings }) => {
    const [isDragging, setIsDragging] = useState(false);
    const handleDragEnter = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
    const handleDragOver = useCallback((e) => { e.preventDefault(); e.stopPropagation(); }, []);
    const handleDrop = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); const files = e.dataTransfer.files; if (files && files.length > 0) { onImageSelect(files[0]); } }, [onImageSelect]);
    const handleFileChange = useCallback((e) => { const files = e.target.files; if (files && files.length > 0) { onImageSelect(files[0]); } }, [onImageSelect]);
    const handleDobChangeCallback = useCallback((val) => { onDobChange(val); }, [onDobChange]);
    
    return (
        <div onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop} className={`w-full h-full border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 flex flex-col items-center justify-between border-rose-300 hover:border-rose-500 bg-rose-50/50 ${isDragging ? 'scale-105 shadow-2xl' : 'shadow-lg'}`}>
            <h2 className="text-2xl font-bold mb-3 font-gaegu">{strings.person1Title}</h2>
            <div className="relative mb-4">
                <img src={previewImage} alt="user" className="w-40 h-40 md:w-48 md:h-48 object-cover mx-auto rounded-full shadow-xl border-4 border-white" onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x400/e2e8f0/cbd5e0?text=Error`; }} />
                <label htmlFor="userImageUpload" className={`absolute bottom-0 right-0 cursor-pointer p-2 rounded-full shadow-lg transition-transform transform hover:scale-110 bg-rose-500 hover:bg-rose-600`}>
                    <UploadCloudIcon className="w-6 h-6 text-white" />
                </label>
                <input type="file" id="userImageUpload" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
            <p className="text-sm font-bold text-indigo-600 mb-4" dangerouslySetInnerHTML={{ __html: strings.uploadInstruction }}></p>
            <div className="w-full max-w-xs">
                <label className="font-bold text-gray-700 mb-1 flex items-center justify-center font-gaegu"><CalendarIcon className="w-5 h-5 mr-2" />{strings.dobLabel}</label>
                <DobInput value={dob} onChange={handleDobChangeCallback} placeholder={strings.dobPlaceholder}/>
            </div>
        </div>
    );
});

const UserInfoSection = React.memo(({ strings, selectedInterests, onInterestToggle, job, onJobChange }) => (
    <div className="w-full h-full p-6 bg-gray-50/50 rounded-lg flex flex-col justify-center items-center shadow-lg border-2 border-dashed border-gray-300 space-y-6">
        <div className="p-4 bg-indigo-50 rounded-lg shadow-inner w-full">
            <h3 className="text-xl font-bold text-indigo-700 mb-3 text-center font-gaegu">{strings.interestSelectionTitle}</h3>
            <div className="flex flex-wrap justify-center gap-2">
                {Object.entries(strings.interests).map(([key, label]) => {
                    const isSelected = selectedInterests.includes(key);
                    return (
                        <button key={key} onClick={() => onInterestToggle(key)}
                            className={`px-4 py-1.5 text-base font-bold rounded-full shadow-md transition-all duration-200 transform ${
                                isSelected 
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white scale-110 shadow-xl' 
                                : 'bg-white text-gray-700 hover:bg-gray-200'
                            } font-gaegu`}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
        </div>
        <div className="w-full max-w-xs">
            <label className="font-bold text-gray-700 mb-1 flex items-center justify-center font-gaegu">
                💼 {strings.jobLabel}
            </label>
            <input 
                type="text" 
                value={job}
                onChange={(e) => onJobChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-center shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={strings.jobPlaceholder}
            />
        </div>
    </div>
));


const MainPageComponent = React.memo(({ currentStrings, handleAnalysis, person1ImageFile, person1Dob, selectedInterests, ...props }) => (
    <div className="font-gowun">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 items-stretch">
            <InputSection 
                onImageSelect={props.handleImageChange} 
                onDobChange={props.handleDobChange} 
                previewImage={props.person1ImagePreview} 
                dob={person1Dob} 
                strings={currentStrings} 
            />
            <UserInfoSection 
                strings={currentStrings} 
                selectedInterests={selectedInterests} 
                onInterestToggle={props.onInterestToggle} 
                job={props.job}
                onJobChange={props.setJob}
            />
        </div>
        <div className="my-6 p-3 bg-gray-100 rounded-lg text-center border border-gray-300"><p className="text-gray-600 text-xs">{currentStrings.adPlaceholderBannerText}</p><img src={`https://placehold.co/300x100/e0e0e0/757575?text=${currentStrings.adPlaceholderBannerText.replace(/\s/g, '+')}`} alt="Ad Banner" className="mx-auto mt-1 rounded" /></div>
        <section className="text-center mt-6">
            <button 
                onClick={handleAnalysis} 
                disabled={!person1ImageFile || !person1Dob || selectedInterests.length === 0}
                className="px-12 py-5 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold text-2xl rounded-lg shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 font-gaegu">
                <SparklesIcon className="inline-block w-8 h-8 mr-2" />
                {currentStrings.analyzeButtonPersonalized}
            </button>
        </section>
    </div>
));

const AnalysisLoadingComponent = React.memo(({ strings, loadingText }) => {
  const [comment, setComment] = useState(strings.loadingComments[0]);
  useEffect(() => {
    const commentInterval = setInterval(() => {
      setComment(strings.loadingComments[Math.floor(Math.random() * strings.loadingComments.length)]);
    }, 2500);
    return () => clearInterval(commentInterval);
  }, [strings.loadingComments]);

  return ( <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 p-4 font-gaegu"> <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl text-center max-w-md w-full"> <h3 className="text-2xl font-bold text-purple-600 mb-4">{loadingText}</h3> <img src={`https://placehold.co/320x100/dedede/777777?text=${strings.adPlaceholderBannerText.replace(/\+/g, '%20')}`} alt="Ad Placeholder" className="mx-auto rounded-md shadow-md mb-6" /> <div className="relative w-full max-w-xs mx-auto flex items-center justify-center mb-4"> <img src={'https://placehold.co/100x100/e2e8f0/cbd5e0?text=...'} alt="Person 1" className="w-24 h-24 object-cover rounded-full shadow-lg border-4 border-rose-400 animate-pulse" /> </div><div className="text-center text-gray-800"> <p className="text-lg h-12 flex items-center justify-center transition-opacity duration-500">"{comment}"</p> <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto animate-spin mt-2"></div> </div></div></div> );
});

// --- [REVISED] 결과 페이지 컴포넌트 ---

// 개별 섹션 컴포넌트
const AnalysisSection = React.memo(({ title, content }) => {
    return (
        <section className="min-h-[80vh] flex items-center justify-center">
            <div className="w-full max-w-2xl mx-auto p-8">
                <h2 className="text-4xl font-black text-center mb-8 font-gaegu text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-300 drop-shadow-lg">{title}</h2>
                <p className="text-lg text-gray-200 leading-relaxed font-gowun whitespace-pre-wrap">{content}</p>
            </div>
        </section>
    );
});

// 새로운 결과 페이지 메인 컴포넌트
const ResultPageComponent = React.memo(({ analysisResult, userImageUrl }) => {
    const sections = useMemo(() => {
        if (!analysisResult) return [];
        // [REVISED] 새로운 서사 구조에 맞춰 파싱
        const { 
            initial_hook, 
            past_validation, 
            core_analysis, 
            future_prophecy, 
            actionable_advice, 
            final_insight 
        } = analysisResult;
        
        const resultSections = [];

        // 각 파트를 별도의 섹션으로 만듦
        if (initial_hook) resultSections.push({ title: "정곡 찌르기", content: initial_hook });
        if (past_validation) resultSections.push({ title: "과거 회상", content: past_validation });
        if (core_analysis) resultSections.push({ title: "본질 분석", content: core_analysis });
        if (future_prophecy) resultSections.push({ title: "미래 시나리오", content: future_prophecy });
        if (actionable_advice) resultSections.push({ title: "생존 지침", content: actionable_advice });
        if (final_insight) resultSections.push({ title: "마지막 조언", content: final_insight });
        
        return resultSections;
    }, [analysisResult]);
    
    return (
        <div className="relative w-full h-screen overflow-y-auto">
            {/* 배경: 사용자 이미지와 별 효과 */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-gray-900" />
                {userImageUrl && (
                    <img src={userImageUrl} alt="User" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-xl scale-110" />
                )}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30" />
            </div>

            {/* 스크롤 가능한 콘텐츠 영역 */}
            <div className="relative z-10 pt-32 pb-32">
                <h1 className="text-5xl font-black text-center mb-16 font-gaegu text-white drop-shadow-lg">
                    {analysisResult.title || "운명 진단서"}
                </h1>
                {sections.map((section, index) => (
                    <AnalysisSection 
                        key={index}
                        title={section.title}
                        content={section.content}
                    />
                ))}
            </div>

            {/* 상단/하단 그라데이션 마스크 */}
            <div className="fixed inset-x-0 top-0 h-48 bg-gradient-to-b from-gray-900 to-transparent pointer-events-none z-20"></div>
            <div className="fixed inset-x-0 bottom-0 h-48 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none z-20"></div>
        </div>
    );
});


// --- Main App Component ---
function App() {
    const [currentStrings, setCurrentStrings] = useState(translations.ko);
    const [pageState, setPageState] = useState('main');
    const [person1ImageFile, setPerson1ImageFile] = useState(null);
    const [person1ImagePreview, setPerson1ImagePreview] = useState(`https://placehold.co/400x400/e2e8f0/cbd5e0?text=Person+1`);
    const [person1Dob, setPerson1Dob] = useState('');
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [job, setJob] = useState('');
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [resultId, setResultId] = useState(null);
    const [copyStatus, setCopyStatus] = useState('');
    const [loadingText, setLoadingText] = useState('');

    useEffect(() => {
        const lang = 'ko';
        setCurrentStrings(translations[lang]);
        setLoadingText(translations[lang].loadingMessage);

        const path = window.location.pathname.split('/');
        if (path[1] === 'result' && path[2]) {
            const id = path[2];
            setIsLoading(true);
            setLoadingText(translations[lang].resultLoading);
            
            const fetchResult = async (retries = 10) => {
                if (!isFirebaseConfigured) {
                    if (retries > 0) {
                        setTimeout(() => fetchResult(retries - 1), 500);
                    } else {
                        console.error("Firebase DB not available after multiple retries.");
                        setError(translations[lang].apiErrorDbConnection);
                        setIsLoading(false);
                        window.history.pushState({}, '', '/');
                        setPageState('main');
                    }
                    return;
                }
                
                try {
                    const docRef = doc(db, "results", id);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setAnalysisResult(data.analysis);
                        setPerson1ImagePreview(data.images.person1);
                        setResultId(id);
                        setPageState('result');
                    } else { 
                        setError(translations[lang].resultNotFound); 
                        window.history.pushState({}, '', '/');
                        setPageState('main'); 
                    }
                } catch (e) {
                    console.error("Error fetching result:", e);
                    setError(translations[lang].resultNotFound); 
                    window.history.pushState({}, '', '/');
                    setPageState('main');
                } finally { 
                    setIsLoading(false); 
                }
            };
            fetchResult();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleImageChange = useCallback((file) => { if (file) { const previewUrl = URL.createObjectURL(file); setPerson1ImageFile(file); setPerson1ImagePreview(previewUrl); setError(''); } }, []);
    const handleDobChange = useCallback((date) => { setPerson1Dob(date); setError(''); }, []);
    
    const handleInterestToggle = useCallback((interestKey) => {
        setSelectedInterests(prev => {
            const newInterests = new Set(prev);
            if (newInterests.has(interestKey)) {
                newInterests.delete(interestKey);
            } else {
                if (newInterests.size < 3) {
                    newInterests.add(interestKey);
                }
            }
            return Array.from(newInterests);
        });
    }, []);

    const resetAllStates = () => { window.history.pushState({}, '', '/'); setPageState('main'); setPerson1ImageFile(null); setPerson1ImagePreview(`https://placehold.co/400x400/e2e8f0/cbd5e0?text=Person+1`); setPerson1Dob(''); setSelectedInterests([]); setJob(''); setAnalysisResult(null); setError(''); setIsLoading(false); setResultId(null); };

    const handleAnalysis = useCallback(async () => {
        if (!person1ImageFile || !person1Dob || selectedInterests.length === 0) { setError(currentStrings.errorMessageDefault); return; }
        
        const isGeminiKeyConfigured = GEMINI_API_KEY && !GEMINI_API_KEY.startsWith('%REACT_APP_');
        if (!isGeminiKeyConfigured) {
            setError("Gemini API 키가 설정되지 않았습니다. Netlify 환경 변수를 확인하세요.");
            return;
        }
        if (!isFirebaseConfigured) {
            setError(currentStrings.apiErrorDbConnection);
            return;
        }

        setLoadingText(currentStrings.loadingMessage); setIsLoading(true); setError('');
        
        try {
            const interestsText = selectedInterests.map(key => currentStrings.interests[key]).join(', ');
            const userInfoText = job ? `직업: ${job}` : '없음';
            let prompt = currentStrings.aiPromptSingle
                .replace("{interests}", interestsText)
                .replace("{userInfo}", userInfoText);
            
            const image1Base64 = await getBase64(person1ImageFile);
            const parts = [{ text: prompt }, { inlineData: { mimeType: person1ImageFile.type, data: image1Base64 } }];

            const payload = { contents: [{ role: "user", parts }], generationConfig: { responseMimeType: "application/json" } };
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

            if (!response.ok) throw new Error(`${currentStrings.apiErrorGeneric} (${response.status})`);
            
            const result = await response.json();
            
            if (!result.candidates?.[0]?.content?.parts?.[0]?.text) { console.error("Invalid API Response:", result); throw new Error(currentStrings.apiErrorResponseFormat); }
            
            let parsedJson;
            try { 
                const rawText = result.candidates[0].content.parts[0].text;
                parsedJson = JSON.parse(rawText); 
            } catch (e) { 
                console.error("JSON parsing error:", e, "Raw text:", result.candidates[0].content.parts[0].text); 
                throw new Error(currentStrings.apiErrorResponseFormat); 
            }
            
            setAnalysisResult(parsedJson);

            if (db && storage) {
                const person1URL = await uploadImageToStorage(person1ImageFile);
                const docRef = doc(collection(db, "results"));
                await setDoc(docRef, { analysis: parsedJson, images: { person1: person1URL, person2: null }, createdAt: serverTimestamp() });
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
    }, [person1ImageFile, person1Dob, selectedInterests, job, currentStrings]);
    
    const handleCopyToClipboard = useCallback((textToCopy) => { if (!textToCopy) return; navigator.clipboard.writeText(textToCopy).then(() => { setCopyStatus(currentStrings.copySuccessMessage); setTimeout(() => setCopyStatus(''), 2000); }); }, [currentStrings.copySuccessMessage]);
    
    return (
        <div className="relative min-h-screen bg-gray-900 font-sans">
            {isLoading && <AnalysisLoadingComponent strings={currentStrings} loadingText={loadingText} />}
            
            <div className={`transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                {pageState === 'main' && (
                    <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-4 sm:p-6 lg:p-8">
                        <header className="w-full max-w-4xl mx-auto mt-12 sm:mt-8 mb-8 text-center font-gaegu">
                            <h1 className="text-5xl sm:text-6xl font-black text-white py-2 flex items-center justify-center drop-shadow-lg [text-shadow:_0_4px_6px_rgb(0_0_0_/_40%)]">
                                <UserIcon className="inline-block w-12 h-12 mr-3 text-cyan-300" />
                                {currentStrings.appTitle}
                            </h1>
                            <p className="text-xl text-indigo-200 mt-3 drop-shadow-md">{currentStrings.appSubtitle}</p>
                        </header>
                        
                        <main className="w-full max-w-4xl mx-auto bg-white/90 backdrop-blur-md shadow-2xl rounded-xl p-6 sm:p-8">
                            <MainPageComponent
                                currentStrings={currentStrings}
                                handleAnalysis={handleAnalysis}
                                handleImageChange={handleImageChange}
                                handleDobChange={handleDobChange}
                                person1ImagePreview={person1ImagePreview}
                                person1Dob={person1Dob}
                                person1ImageFile={person1ImageFile}
                                selectedInterests={selectedInterests}
                                onInterestToggle={handleInterestToggle}
                                job={job}
                                setJob={setJob}
                            />
                        </main>
                        {error && <p className="text-red-500 bg-red-100 border border-red-300 rounded-md p-4 text-md mt-4 max-w-md mx-auto shadow-md animate-shake text-center font-bold">{error}</p>}
                        <footer className="w-full max-w-4xl mx-auto mt-12 text-center pb-8">
                            <p className="text-md text-white/90 drop-shadow-sm">© {new Date().getFullYear()} AI 운명 비기. Just for Fun!</p>
                        </footer>
                    </div>
                )}

                {pageState === 'result' && analysisResult && 
                    <div>
                        <ResultPageComponent analysisResult={analysisResult} userImageUrl={person1ImagePreview} />
                        {/* 결과 페이지의 버튼들은 페이지 하단에 고정 (z-index 수정) */}
                        <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-black/30 backdrop-blur-sm">
                            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button onClick={() => handleCopyToClipboard(`${window.location.origin}/result/${resultId}`)} disabled={!resultId} className="flex items-center justify-center px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg shadow-lg transition-colors disabled:bg-gray-400 font-gaegu">
                                    <LinkIcon className="w-5 h-5 mr-2" /> {currentStrings.copyButton}
                                </button>
                                <button onClick={resetAllStates} className="flex items-center justify-center px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg shadow-lg transition-colors text-lg font-gaegu">
                                    <RefreshCwIcon className="w-6 h-6 mr-3" /> {currentStrings.retryButton}
                                </button>
                            </div>
                            {copyStatus && <p className="text-center text-md text-green-400 mt-2 font-semibold animate-bounce">{copyStatus}</p>}
                        </div>
                    </div>
                }
            </div>
        </div>
    );
}

export default App;
