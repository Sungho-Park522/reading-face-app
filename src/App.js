import React, { useState, useCallback, useEffect, useRef } from 'react';
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
    aiPromptSingle: `당신은 인간의 욕망과 운명을 꿰뚫어 보는, 압도적인 카리스마를 가진 예언가입니다. 사용자의 사진(관상), 생년월일(사주), 그리고 다음 정보를 바탕으로 분석을 진행합니다.
    - 가장 절실한 관심사: {interests}
    - 추가 정보: {userInfo}

    **[분석 목표]**
    - 사용자가 자신의 미래에 대한 명확한 지침과 강한 인상을 받도록 해야 합니다.
    - "아마도" 같은 모호한 표현은 절대 금물. "그렇게 될 것이다", "반드시 기억하게" 와 같이 단정적이고 힘 있는 말투를 사용하세요.
    - **오직 사용자가 선택한 관심사({interests})에 대한 내용만 분석하고, 그 외의 관심사에 대한 내용은 JSON 객체에 아예 포함하지 마세요.**

    **[분석 지침]**
    1.  **도입 (introduction)**: "흠... 그대의 눈을 보니 보통내기가 아니군." 과 같이, 사용자를 압도하는 카리스마 넘치는 한마디로 시작하세요.
    2.  **관심사별 심층 분석**: 사용자가 선택한 {interests} 항목 각각에 대해, 아래 내용을 포함하여 구체적이고 현실적인 분석을 제공하세요.
        -   **타고난 그릇 (nature)**: 해당 관심사에 대한 사용자의 타고난 재능, 기질, 약점 등을 날카롭게 분석합니다.
        -   **과거의 흔적 (past_trace)**: 해당 관심사와 관련하여 과거(특히 20대)에 겪었을 법한 중요한 사건이나 경험을 짚어주어 신뢰를 구축합니다.
        -   **미래의 계시 (prophecy)**: 앞으로 2~3년 안에 일어날 중요한 사건, 만나게 될 사람, 잡아야 할 기회 등을 구체적인 시기(예: 2025년 여름, 2026년)와 함께 단정적으로 예언합니다.
        -   **성공 비결 (secret_to_success)**: 해당 분야에서 성공하기 위해 반드시 지켜야 할 행동 강령이나 조언을 제공합니다.
    3.  **최종 조언 (final_advice)**: 모든 분석을 마무리하며, 사용자가 운명을 개척하기 위해 마음에 새겨야 할 가장 중요한 핵심 메시지를 전달합니다.

    **[JSON 응답 형식]**
    반드시 아래의 JSON 구조를 완벽하게 준수하여 응답해야 합니다. \`analysis\` 객체 안에는 **오직 사용자가 선택한 관심사의 키만 포함**되어야 합니다. (예: 사용자가 '재물', '사랑'을 선택했다면 'wealth', 'love' 키만 포함)
    {
      "analysis_type": "single",
      "introduction": "...",
      "analysis": {
        "wealth": { "title": "💰 재물", "nature": "...", "past_trace": "...", "prophecy": "...", "secret_to_success": "..." }
      },
      "final_advice": "..."
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

const useTypingEffect = (text, speed = 50) => {
    const [displayedText, setDisplayedText] = useState('');
    
    useEffect(() => {
        setDisplayedText(''); // Reset when text changes
        if (text) {
            let i = 0;
            const intervalId = setInterval(() => {
                setDisplayedText(prev => prev + text.charAt(i));
                i++;
                if (i > text.length) {
                    clearInterval(intervalId);
                }
            }, speed);
            return () => clearInterval(intervalId);
        }
    }, [text, speed]);
    
    return displayedText;
};

const ResultPageComponent = React.memo(({ analysisResult }) => {
    const { introduction, analysis, final_advice } = analysisResult;
    const [messageQueue, setMessageQueue] = useState([]);
    const [currentMessage, setCurrentMessage] = useState({ text: '...' });
    const [isThinking, setIsThinking] = useState(false);
    
    const typedText = useTypingEffect(currentMessage.text, 30);

    useEffect(() => {
        const createQueue = () => {
            const queue = [];
            queue.push({ type: 'intro', text: introduction });
            
            Object.values(analysis).forEach(topic => {
                queue.push({ type: 'header', text: topic.title });
                queue.push({ type: 'bubble', text: `**타고난 그릇**\n${topic.nature}` });
                queue.push({ type: 'bubble', text: `**과거의 흔적**\n${topic.past_trace}` });
                queue.push({ type: 'bubble', text: `**미래의 계시**\n${topic.prophecy}` });
                queue.push({ type: 'bubble', text: `**성공 비결**\n${topic.secret_to_success}` });
            });
            
            queue.push({ type: 'final', text: final_advice });
            return queue;
        };
        
        setMessageQueue(createQueue());
    }, [introduction, analysis, final_advice]);
    
    useEffect(() => {
        if (messageQueue.length > 0) {
            const showNextMessage = () => {
                setIsThinking(true);
                setTimeout(() => {
                    setMessageQueue(prev => {
                        const next = prev.slice(1);
                        setCurrentMessage(prev[0]);
                        setIsThinking(false);
                        if (next.length > 0) {
                            setTimeout(showNextMessage, (prev[0]?.text?.length || 0) * 30 + 1500); // Wait for text to type + 1.5s
                        }
                        return next;
                    });
                }, 1000); // 1s thinking time
            };
            showNextMessage();
        }
    }, [messageQueue]);

    const renderTextWithBold = (text) => {
        const parts = text.split(/(\*\*.*?\*\*)/g).filter(Boolean);
        return parts.map((part, i) =>
            part.startsWith('**') && part.endsWith('**') ?
            <strong key={i} className="font-bold font-gaegu text-indigo-700">{part.slice(2, -2)}</strong> :
            part
        );
    };

    return (
        <div className="flex flex-col h-[70vh] bg-gradient-to-br from-gray-800 via-gray-900 to-black p-4 rounded-2xl shadow-2xl border-2 border-yellow-500">
            <div className="flex-shrink-0 text-center relative h-32">
                 {/* 점쟁이 캐릭터 SVG */}
                <svg className="w-32 h-32 mx-auto" viewBox="0 0 100 100">
                    <defs>
                        <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f2d5b1"/>
                            <stop offset="100%" stopColor="#e4b98d"/>
                        </linearGradient>
                        <linearGradient id="robe" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4a044e"/>
                            <stop offset="100%" stopColor="#1e1b4b"/>
                        </linearGradient>
                         <radialGradient id="eye-shine" cx="0.4" cy="0.4" r="0.6">
                            <stop offset="0%" stopColor="white" stopOpacity="0.8"/>
                            <stop offset="100%" stopColor="white" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    {/* 몸체 */}
                    <path d="M10 90 Q 50 70, 90 90 L 95 100 L 5 100 z" fill="url(#robe)"/>
                     {/* 얼굴 */}
                    <circle cx="50" cy="40" r="25" fill="url(#skin)"/>
                     {/* 손 */}
                    <path d="M 65 50 C 60 55, 60 65, 72 68 Q 80 60, 75 52 z" fill="url(#skin)"/>
                    {/* 머리카락 */}
                    <path d="M 25 20 Q 50 10, 75 20 L 78 45 A 25 25 0 0 1 22 45 z" fill="#333"/>
                     {/* 눈 */}
                    <circle cx="40" cy="40" r="3" fill="#333"/>
                    <circle cx="60" cy="40" r="3" fill="#333"/>
                    <circle cx="41" cy="39" r="1" fill="url(#eye-shine)"/>
                    <circle cx="61" cy="39" r="1" fill="url(#eye-shine)"/>
                     {/* 눈썹 */}
                    <path d="M35 32 Q 40 30, 45 32" stroke="#333" strokeWidth="1.5" fill="none"/>
                    <path d="M55 32 Q 60 30, 65 32" stroke="#333" strokeWidth="1.5" fill="none"/>
                    {/* 입 */}
                    <path d="M45 52 Q 50 50, 55 52" stroke="#333" strokeWidth="1" fill="none"/>
                </svg>
            </div>
            
            <div className="flex-grow flex flex-col justify-center min-h-0">
                <div className="relative bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-inner border border-gray-300 min-h-[150px]">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[15px] border-white/90"></div>
                     {isThinking && <p className="text-2xl font-bold text-gray-500 animate-pulse">...</p>}
                    {!isThinking && <div className="text-gray-800 text-lg leading-relaxed font-gowun">{renderTextWithBold(typedText)}</div>}
                </div>
                 <div className="text-center mt-4 text-xs text-indigo-300 font-sans">
                     {currentMessage.type === 'final' ? '모든 풀이가 끝났습니다.' : messageQueue.length > 0 ? `${messageQueue.length}개의 풀이가 남았습니다.` : '운명의 비밀을 푸는 중...'}
                </div>
            </div>
        </div>
    );
});


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
            const fetchResult = async () => {
                if (!db) { setTimeout(fetchResult, 300); return; }
                try {
                    const docRef = doc(db, "results", id);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setAnalysisResult(data.analysis);
                        setPerson1ImagePreview(data.images.person1);
                        setResultId(id);
                        setPageState('result');
                    } else { setError(translations[lang].resultNotFound); setPageState('main'); }
                } catch (e) {
                    console.error("Error fetching result:", e);
                    setError(translations[lang].resultNotFound); setPageState('main');
                } finally { setIsLoading(false); }
            };
            fetchResult();
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

    const resetAllStates = () => { window.history.pushState({}, '', '/'); setPageState('main'); setPerson1ImageFile(null); setPerson1ImagePreview(`https://placehold.co/400x400/e2e8f0/cbd5e0?text=Person+1`); setPerson1Dob(''); setSelectedInterests([]); setJob(''); setAnalysisResult(null); setError(''); setIsLoading(false); setResultId(null); };

    const handleAnalysis = useCallback(async () => {
        if (!person1ImageFile || !person1Dob || selectedInterests.length === 0) { setError(currentStrings.errorMessageDefault); return; }
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
            try { parsedJson = JSON.parse(result.candidates[0].content.parts[0].text); } catch (e) { console.error("JSON parsing error:", e, "Raw text:", result.candidates[0].content.parts[0].text); throw new Error(currentStrings.apiErrorResponseFormat); }
            
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
        <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-4 sm:p-6 lg:p-8 flex flex-col font-sans">
            {isLoading && <AnalysisLoadingComponent strings={currentStrings} loadingText={loadingText} />}
            <div className={`w-full mx-auto transition-all duration-500 ${isLoading ? 'opacity-50 blur-sm pointer-events-none' : 'opacity-100'}`}>
                { pageState !== 'result' && 
                    <header className="w-full max-w-4xl mx-auto mt-12 sm:mt-8 mb-8 text-center font-gaegu">
                        <h1 className="text-5xl sm:text-6xl font-black text-white py-2 flex items-center justify-center drop-shadow-lg [text-shadow:_0_4px_6px_rgb(0_0_0_/_40%)]">
                            <UserIcon className="inline-block w-12 h-12 mr-3 text-cyan-300" />
                            {currentStrings.appTitle}
                        </h1>
                        <p className="text-xl text-indigo-200 mt-3 drop-shadow-md">{currentStrings.appSubtitle}</p>
                    </header>
                }
                
                <main className={`w-full max-w-4xl mx-auto transition-colors duration-300 ${pageState === 'result' ? 'bg-transparent' : 'bg-white/90'} backdrop-blur-md shadow-2xl rounded-xl p-6 sm:p-8`}>
                    {pageState === 'main' && (
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
                    )}
                    {pageState === 'result' && analysisResult && 
                        <div>
                            <ResultPageComponent analysisResult={analysisResult} />
                            <div className="mt-10 pt-6 border-t-2 border-dashed border-gray-600 flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button onClick={() => handleCopyToClipboard(`${window.location.origin}/result/${resultId}`)} disabled={!resultId} className="flex items-center justify-center px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg shadow-lg transition-colors disabled:bg-gray-400 font-gaegu">
                                    <LinkIcon className="w-5 h-5 mr-2" /> {currentStrings.copyButton}
                                </button>
                                <button onClick={resetAllStates} className="flex items-center justify-center px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg shadow-lg transition-colors text-lg font-gaegu">
                                    <RefreshCwIcon className="w-6 h-6 mr-3" /> {currentStrings.retryButton}
                                </button>
                            </div>
                            {copyStatus && <p className="text-center text-md text-green-400 mt-4 font-semibold animate-bounce">{copyStatus}</p>}
                        </div>
                    }
                    {error && <p className="text-red-500 bg-red-100 border border-red-300 rounded-md p-4 text-md mt-4 max-w-md mx-auto shadow-md animate-shake text-center font-bold">{error}</p>}
                </main>
                 { pageState !== 'result' &&
                    <footer className="w-full max-w-4xl mx-auto mt-12 text-center">
                        <p className="text-md text-white/90 drop-shadow-sm">© {new Date().getFullYear()} AI 운명 비기. Just for Fun!</p>
                    </footer>
                }
            </div>
        </div>
    );
}

export default App;
