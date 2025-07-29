import React, { useState, useCallback, useEffect, useRef } from 'react';
// Firebase SDK import
import { initializeApp, getApps } from "firebase/app";
// [FIXED] 사용하지 않는 Firestore import 제거
import { getAuth, signInAnonymously } from "firebase/auth";
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "firebase/storage";


// ★★★ API 키 설정 영역 ★★★
// [FIXED] 'process' 객체의 존재 여부를 확인하여 어떤 환경에서든 에러가 발생하지 않도록 수정
const firebaseConfig = {
  apiKey: typeof process !== 'undefined' ? process.env.REACT_APP_FIREBASE_API_KEY : "",
  authDomain: typeof process !== 'undefined' ? process.env.REACT_APP_FIREBASE_AUTH_DOMAIN : "",
  projectId: typeof process !== 'undefined' ? process.env.REACT_APP_FIREBASE_PROJECT_ID : "",
  storageBucket: typeof process !== 'undefined' ? process.env.REACT_APP_FIREBASE_STORAGE_BUCKET : "",
  messagingSenderId: typeof process !== 'undefined' ? process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID : "",
  appId: typeof process !== 'undefined' ? process.env.REACT_APP_FIREBASE_APP_ID : "",
};
const GEMINI_API_KEY = typeof process !== 'undefined' ? process.env.REACT_APP_GEMINI_API_KEY : "";


// Firebase 앱 초기화 및 서비스 가져오기
// [FIXED] 사용하지 않는 db 변수 제거
let app, auth, storage;
const isFirebaseConfigured = Object.values(firebaseConfig).every(v => v);

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
    // db = getFirestore(app); // [FIXED] 사용하지 않으므로 제거
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
// [FIXED] 사용하지 않는 LinkIcon 제거
const RefreshCwIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path></svg>);
const CalendarIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>);
const SparklesIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.9 5.8-5.8 1.9 5.8 1.9 1.9 5.8 1.9-5.8 5.8-1.9-5.8-1.9z"/><path d="M22 12a10 10 0 1 1-10-10"/><path d="M22 12a10 10 0 0 0-10-10"/></svg>);
const SendIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>);

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
    // [REVISED] 대화형 UX를 위한 AI 프롬프트 v2.0
    aiPromptSingle: `당신은 '운이'라는 이름을 가진, 인간의 운명을 꿰뚫어 보는 AI 예언가입니다. 당신의 말은 날카롭고 직설적이며, 때로는 장난기 있는 반말을 사용합니다. 사용자와 1:1로 대화하며 운명을 진단하세요.

**[기본 정보]**
- 사용자의 관심사: {interests}
- 사용자의 생년월일: {dob}
- 사용자의 추가 정보: {userInfo}
- 사용자의 핵심 질문: {userQuery}

**[진단 목표]**
- 사용자가 "내 얘기를 어떻게 알았지?"라고 소름 돋게 만들어야 합니다.
- 모든 답변은 단계별로 분절하여, 실제 대화처럼 느껴지도록 해야 합니다.
- 사용자의 핵심 질문({userQuery})을 중심으로 모든 서사를 풀어가야 합니다.

**[진단서 구조 및 지침]**
1.  **초기 반응 (initial_hook)**: 사용자의 얼굴 사진에서 느껴지는 기운과 핵심 질문을 엮어, 정곡을 찌르는 첫마디를 던지세요. (예: "결혼? 니 얼굴에 '나 외로워요' 써 있는데, 결혼이 쉽겠냐?")
2.  **과거 감정선 (past_emotion)**: 질문과 관련하여 사용자가 과거에 겪었을 법한 가장 강렬한 감정적 경험을 짚어주세요. (예: "2021년 즈음, 인간관계에서 크게 무너졌을 텐데… 아마 믿었던 사람한테 뒤통수 맞았거나.")
3.  **본질 분석 (core_analysis)**: 생년월일(사주)과 관상을 결합하여, 질문과 관련된 사용자의 근본적인 성향과 약점을 분석해주세요. (예: "니 사주를 보니 겉은 차가운데 속은 불덩이구나. 그러니 정작 중요할 때 감정적으로 다 망치지.")
4.  **미래 시나리오 (future_scenario)**: 앞으로 2~3년 내에 질문과 관련하여 겪게 될 구체적인 사건을 생생하게 묘사하세요. (예: "2025년 가을, 전혀 예상치 못한 자리에서 옛 인연과 다시 마주치게 될 거야. 근데 그게 독이 든 성배다.")
5.  **생존 지침 (survival_guide)**: 미래 시나리오에 대처하기 위한, 아주 구체적이고 직설적인 행동 지침을 내려주세요. (예: "그 사람 다시 만나도 절대 돈 거래는 하지 마. 니 자존심까지 팔게 될 테니.")
6.  **마지막 한마디 (final_quote)**: 사용자의 인생 전체를 관통하는, 가슴에 박히는 조언으로 대화를 마무리하세요. (예: "넌 결국, 혼자가 되는 걸 두려워하지 않는 날 진짜 강해질 거야.")

**[JSON 응답 형식]**
반드시 아래의 JSON 구조를 완벽하게 준수하여 응답해야 합니다.
{
  "initial_hook": "...",
  "past_emotion": "...",
  "core_analysis": "...",
  "future_scenario": "...",
  "survival_guide": "...",
  "final_quote": "..."
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

// [FIXED] 사용하지 않는 uploadImageToStorage 함수 제거

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

// --- [REVISED] 대화형 결과 페이지 컴포넌트 ---
const ResultPageComponent = React.memo(({ messages, onSendMessage, isTyping, onReset }) => {
    const [userInput, setUserInput] = useState('');
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSend = () => {
        if (userInput.trim()) {
            onSendMessage(userInput);
            setUserInput('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="relative w-full h-screen flex flex-col bg-gray-900">
            {/* 배경 효과 */}
            <div className="absolute inset-0 -z-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
            
            {/* 헤더 */}
            <header className="flex-shrink-0 p-4 bg-black/30 backdrop-blur-sm flex justify-between items-center z-10">
                <h1 className="text-xl font-bold text-white font-gaegu">운이(雲異)와의 대화</h1>
                <button onClick={onReset} className="text-sm text-gray-300 hover:text-white">
                    <RefreshCwIcon className="w-5 h-5" />
                </button>
            </header>

            {/* 메시지 목록 */}
            <div className="flex-grow p-4 overflow-y-auto">
                <div className="max-w-3xl mx-auto space-y-6">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'ai' && <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex-shrink-0 shadow-lg" />}
                            <div className={`px-4 py-3 rounded-2xl max-w-sm md:max-w-md lg:max-w-lg shadow-md font-gowun ${msg.sender === 'user' ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex items-end gap-3 justify-start">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex-shrink-0 shadow-lg" />
                            <div className="px-4 py-3 rounded-2xl bg-gray-700 shadow-md">
                                <div className="flex items-center justify-center space-x-1">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div ref={chatEndRef} />
            </div>

            {/* 입력창 */}
            <div className="flex-shrink-0 p-4 bg-black/30 backdrop-blur-sm z-10">
                <div className="max-w-3xl mx-auto flex items-center gap-3">
                    <textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="그래서, 네 인생에서 지금 뭐가 제일 궁금한가?"
                        className="flex-grow p-3 bg-gray-700 text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800"
                        rows="1"
                    />
                    <button onClick={handleSend} disabled={!userInput.trim() || isTyping} className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
                        <SendIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
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
    
    // [NEW] 대화형 상태 관리
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    // [FIXED] 사용하지 않는 resultId 상태 제거
    const [loadingText, setLoadingText] = useState('');

    useEffect(() => {
        const lang = 'ko';
        setCurrentStrings(translations[lang]);
        setLoadingText(translations[lang].loadingMessage);

        const path = window.location.pathname.split('/');
        if (path[1] === 'result' && path[2]) {
            // 대화형 UX에서는 결과 페이지 직접 로드를 지원하지 않으므로 메인으로 리디렉션
            window.history.pushState({}, '', '/');
            setPageState('main');
        }
    }, []);

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

    const resetAllStates = () => { 
        window.history.pushState({}, '', '/'); 
        setPageState('main'); 
        setPerson1ImageFile(null); 
        setPerson1ImagePreview(`https://placehold.co/400x400/e2e8f0/cbd5e0?text=Person+1`); 
        setPerson1Dob(''); 
        setSelectedInterests([]); 
        setJob(''); 
        setMessages([]);
        setError(''); 
        setIsLoading(false); 
    };

    const startConversation = () => {
        if (!person1ImageFile || !person1Dob || selectedInterests.length === 0) { 
            setError(currentStrings.errorMessageDefault); 
            return; 
        }
        setMessages([
            { sender: 'ai', text: '흠… 널 보니, 뭔가 묘한 기운이 흐르는데?' },
            { sender: 'ai', text: '잠깐… 내가 보기엔 네 눈빛이 심상치 않다.' },
        ]);
        setPageState('result');
    };

    const handleSendMessage = useCallback(async (userQuery) => {
        setMessages(prev => [...prev, { sender: 'user', text: userQuery }]);
        setIsTyping(true);
        setError('');

        if (!GEMINI_API_KEY) {
            setError("Gemini API 키가 설정되지 않았습니다. Netlify 환경 변수를 확인하세요.");
            setIsTyping(false);
            return;
        }

        try {
            const interestsText = selectedInterests.map(key => currentStrings.interests[key]).join(', ');
            const userInfoText = job ? `직업: ${job}` : '없음';
            let prompt = currentStrings.aiPromptSingle
                .replace("{interests}", interestsText)
                .replace("{dob}", person1Dob)
                .replace("{userInfo}", userInfoText)
                .replace("{userQuery}", userQuery);
            
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

            // 단계별 메시지 출력
            const analysisSteps = [
                parsedJson.initial_hook,
                parsedJson.past_emotion,
                parsedJson.core_analysis,
                parsedJson.future_scenario,
                parsedJson.survival_guide,
                parsedJson.final_quote
            ];

            for (const step of analysisSteps) {
                if (step) {
                    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
                    setMessages(prev => [...prev, { sender: 'ai', text: step }]);
                }
            }

        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { sender: 'ai', text: err.message || currentStrings.apiErrorGeneric }]);
        } finally {
            setIsTyping(false);
        }
    }, [person1ImageFile, person1Dob, selectedInterests, job, currentStrings]);
    
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
                                handleAnalysis={startConversation} // [REVISED]
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

                {pageState === 'result' && (
                    <ResultPageComponent 
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        isTyping={isTyping}
                        onReset={resetAllStates}
                    />
                )}
            </div>
        </div>
    );
}

export default App;
