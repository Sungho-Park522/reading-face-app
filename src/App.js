import React, { useState, useEffect, useRef } from 'react';

// --- 아이콘 컴포넌트들 ---
const UploadCloudIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m16 16-4-4-4 4"></path></svg>);
const Volume2Icon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>);
const VolumeXIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>);

// --- BGM 플레이어 ---
const BGMPlayer = () => {
    const [isMuted, setIsMuted] = useState(false);
    const [isToneLoaded, setIsToneLoaded] = useState(false);
    const synth = useRef(null);
    const loop = useRef(null);

    useEffect(() => {
        if (window.Tone) { setIsToneLoaded(true); return; }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js';
        script.async = true;
        script.onload = () => setIsToneLoaded(true);
        script.onerror = () => console.error("Failed to load Tone.js from CDN.");
        document.body.appendChild(script);
        return () => { if (document.body.contains(script)) { document.body.removeChild(script); }};
    }, []);

    useEffect(() => {
        if (isToneLoaded) {
            const Tone = window.Tone;
            synth.current = new Tone.AMSynth({ harmonicity: 1.5, envelope: { attack: 0.1, decay: 0.2, sustain: 0.1, release: 1.2 }, modulation: { type: 'sine' }, modulationEnvelope: { attack: 0.5, decay: 0.01 } }).toDestination();
            loop.current = new Tone.Loop(time => {
                const notes = ['C2', 'E2', 'G2', 'A2'];
                const randomNote = notes[Math.floor(Math.random() * notes.length)];
                if(synth.current) synth.current.triggerAttackRelease(randomNote, '2n', time);
            }, '2m').start(0);
            Tone.Transport.start();
            return () => {
                if (Tone.Transport.state === 'started') Tone.Transport.stop();
                if (loop.current) loop.current.dispose();
                if (synth.current) synth.current.dispose();
            };
        }
    }, [isToneLoaded]);

    const toggleMute = () => {
        if (!isToneLoaded) return;
        const Tone = window.Tone;
        Tone.start().then(() => {
            if (Tone.getDestination()) { Tone.getDestination().mute = !isMuted; }
            setIsMuted(!isMuted);
        });
    };

    return (
        <button onClick={toggleMute} className="fixed top-4 right-4 text-white z-50 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors">
            {isMuted ? <VolumeXIcon className="w-6 h-6" /> : <Volume2Icon className="w-6 h-6" />}
        </button>
    );
};


// --- 제자 시퀀스 설정 ---
const apprenticeSequence = [
  { image: '/apprentice-standing.png', dialogue: [ { type: 'bold', text: '어서 오세요!' }, { type: 'bold', text: '저는 스승님의 제자 초희입니다.' }, ] },
  { image: '/apprentice-greeting.png', dialogue: [ { type: 'bold', text: '먼 길 오시느라 고생 많으셨습니다.' } ] },
  { image: '/apprentice-guiding.png', dialogue: [ { type: 'bold', text: '이 두루마리에' }, { type: 'bold', text: '스승님께 보여드릴 사진 한 장과' }, { type: 'bold', text: '생년월일을 기록해주시겠습니까?' } ] },
];


// --- 메인 앱 컴포넌트 ---
function App() {
    const [appPhase, setAppPhase] = useState('loading');
    const [userPhoto, setUserPhoto] = useState(null);
    const [birthdate, setBirthdate] = useState('');
    const [photoPreview, setPhotoPreview] = useState(null);
    const [animationState, setAnimationState] = useState({
        showTitle: false,
        showSubtitle: false,
        showApprentice: false,
    });
    const [isFinalDialogueFinished, setIsFinalDialogueFinished] = useState(false);
    const [isScrollUnfurled, setIsScrollUnfurled] = useState(false);
    const [sequenceStep, setSequenceStep] = useState(0);
    const [displayedDialogues, setDisplayedDialogues] = useState([]);
    
    // --- 스타일 및 애니메이션 조절 변수 ---
    const formBottomOffset = 20;
    const formWidthPercent = 80;
    const initialDialogueDelay = 1000;

    // 1. 로딩 단계 컨트롤러
    useEffect(() => {
        const imagePaths = [ ...apprenticeSequence.map(s => s.image), '/scroll-unfurled.png', '/scroll-rolled.png' ];
        const preloadImages = (paths) => Promise.all(paths.map(path => new Promise(resolve => {
            const img = new Image();
            img.src = path;
            img.onload = resolve;
            img.onerror = resolve;
        })));
        const imagePromise = preloadImages(imagePaths);
        const minTimePromise = new Promise(resolve => setTimeout(resolve, 3000));
        Promise.all([imagePromise, minTimePromise]).then(() => {
            setAppPhase('intro');
        });
    }, []);

    // 2. 인트로 애니메이션 컨트롤러
    useEffect(() => {
        if (appPhase !== 'intro') return;
        const timers = [];
        const subtitleAppearTime = 1200;
        const apprenticeAppearTime = subtitleAppearTime + 2000;
        
        timers.push(setTimeout(() => setAnimationState(s => ({ ...s, showTitle: true })), 500));
        timers.push(setTimeout(() => setAnimationState(s => ({ ...s, showSubtitle: true })), subtitleAppearTime));
        timers.push(setTimeout(() => setAnimationState(s => ({ ...s, showApprentice: true })), apprenticeAppearTime));
        
        const scene1StartTime = apprenticeAppearTime + 4000;
        timers.push(setTimeout(() => setSequenceStep(1), scene1StartTime));
        const scene2StartTime = scene1StartTime + 4000;
        timers.push(setTimeout(() => setSequenceStep(2), scene2StartTime));
        
        return () => timers.forEach(clearTimeout);
    }, [appPhase]);

    // 3. 대사 렌더링 로직
    useEffect(() => {
        if (appPhase !== 'intro' || !animationState.showApprentice) return;
        const currentScene = apprenticeSequence[sequenceStep];
        if (!currentScene) return;

        setDisplayedDialogues([]);
        let dialogueTimer = initialDialogueDelay;
        const timers = currentScene.dialogue.map((dialogue, index) => {
            const timer = setTimeout(() => {
                setDisplayedDialogues(prev => [...prev, dialogue]);
                if (sequenceStep === 2 && index === currentScene.dialogue.length - 1) {
                    setIsFinalDialogueFinished(true);
                }
            }, dialogueTimer);
            dialogueTimer += 800;
            return timer;
        });

        return () => timers.forEach(clearTimeout);
    }, [sequenceStep, animationState.showApprentice, appPhase, initialDialogueDelay]);

    // 4. 폼 관련 함수
    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUserPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = () => {
        if (!userPhoto || !birthdate) {
            alert("사진과 생년월일을 모두 입력해주십시오.");
            return;
        }
        console.log("Submitted Data:", { userPhoto, birthdate });
        alert("정보가 접수되었습니다. 다음 단계로 진행합니다.");
    };

    const handleBirthdateChange = (e) => {
        let value = e.target.value.replace(/[^\d]/g, '');
        if (value.length > 8) {
            value = value.slice(0, 8);
        }

        let formattedValue = '';
        if (value.length > 4) {
            formattedValue = value.substring(0, 4) + '-';
            if (value.length > 6) {
                formattedValue += value.substring(4, 6) + '-' + value.substring(6);
            } else {
                formattedValue += value.substring(4);
            }
        } else {
            formattedValue = value;
        }
        setBirthdate(formattedValue);
    };

    const isRolledScrollVisible = isFinalDialogueFinished && !isScrollUnfurled;

    return (
        <div className="w-full h-screen bg-gray-900 overflow-hidden relative font-gowun">
            <style>{`
                @keyframes pop-in { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }
                .dialogue-line { animation: pop-in 0.3s ease-out forwards; }
                @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
                .apprentice-image-fade-in { animation: fade-in 0.7s ease-in-out forwards; }

                .responsive-title {
                    /* [MODIFIED] 폰트 크기 최소값을 줄여 줄바꿈 방지 강화 */
                    font-size: clamp(2rem, 8.5vw, 3rem);
                }
                @media (min-width: 768px) {
                    .responsive-title {
                        font-size: 3.75rem;
                    }
                }
                
                @media (max-width: 768px) {
                    .apprentice-container {
                        right: -40px;
                    }
                    .dialogue-bubble {
                        left: -200px;
                        width: 190px;
                    }
                }
            `}</style>
            <BGMPlayer />
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/50 to-black z-0"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 z-0" />
            
            {/* [MODIFIED] 로딩 말풍선 구조 변경 및 위치 재설정 */ }
            {appPhase === 'loading' && (
                 <div className="absolute bottom-40 right-5 z-10 animate-pulse">
                    <div className="relative w-56 p-4 bg-white text-gray-800 rounded-xl shadow-2xl">
                        <p className="font-bold text-lg">잠시만요 나가고 있어요!</p>
                        <div className="absolute top-1/2 -translate-y-1/2 right-[-5px] w-0 h-0 border-y-[10px] border-y-transparent border-l-[10px] border-l-white"></div>
                    </div>
                 </div>
            )}

            {appPhase === 'intro' && (
                <>
                    {/* [MODIFIED] 제목/부제 컨테이너 위치를 위로 조정 (top-1/4 -> top-[18%]) */ }
                    <div className={`absolute top-[18%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white transition-all duration-1000 ${animationState.showTitle ? 'opacity-100' : 'opacity-0 -translate-y-10'}`}>
                        <h1 className="responsive-title font-black font-gaegu mb-4 text-shadow-lg">AI 운명 비기</h1>
                    </div>
                    {/* [MODIFIED] 부제 컨테이너 위치도 함께 조정 */ }
                    <div className={`absolute top-[18%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white transition-all duration-1000 delay-500 mt-20 ${animationState.showSubtitle ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
                        <p className="text-xl md:text-2xl text-indigo-200 text-shadow">운명의 실타래를 풀어, 그대의 길을 밝혀드립니다.</p>
                    </div>

                    <div className={`apprentice-container absolute bottom-0 right-0 transition-transform duration-1000 ease-out ${animationState.showApprentice ? 'translate-x-0' : 'translate-x-full'}`}>
                        <img key={apprenticeSequence[sequenceStep].image} src={apprenticeSequence[sequenceStep].image} alt="점쟁이 제자" className="w-[200px] h-[320px] md:w-[250px] md:h-[400px] object-contain drop-shadow-2xl apprentice-image-fade-in" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/250x400/000000/FFFFFF?text=이미지오류'; }} />
                        
                        <div className={`dialogue-bubble absolute top-40 md:top-20 -left-56 w-56 p-4 bg-white text-gray-800 rounded-xl shadow-2xl transition-opacity duration-300 ${displayedDialogues.length > 0 ? 'opacity-100' : 'opacity-0'}`}>
                            {displayedDialogues.map((dialogue, index) => ( 
                                <p key={index} className={`dialogue-line ${dialogue.type === 'bold' ? 'font-bold text-base md:text-lg' : ''}`}>{dialogue.text}</p> 
                            ))}
                            <div className="absolute top-1/2 -translate-y-1/2 right-[-5px] w-0 h-0 border-y-[10px] border-y-transparent border-l-[10px] border-l-white"></div>
                        </div>
                    </div>
                    
                    <div onClick={() => setIsScrollUnfurled(true)} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 transition-opacity duration-700 ${isRolledScrollVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <div className="flex flex-col items-center justify-center cursor-pointer">
                            <img src="/scroll-rolled.png" alt="말려있는 두루마리" className="w-24 drop-shadow-2xl transition-transform hover:scale-110" />
                            <p className="text-white text-center mt-4 font-gaegu text-lg animate-pulse">두루마리를 펼쳐주세요.</p>
                        </div>
                    </div>

                    {isScrollUnfurled && (
                        <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4 animate-[fade-in_0.3s_ease-out]" onClick={() => setIsScrollUnfurled(false)}>
                            <div onClick={(e) => e.stopPropagation()} className="relative w-auto h-full max-h-[95vh] aspect-[9/16]">
                                <div className="absolute inset-0 bg-contain bg-no-repeat bg-center" style={{ backgroundImage: `url('/scroll-unfurled.png')` }}></div>
                                <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ bottom: `${formBottomOffset}%`, width: `${formWidthPercent}%` }}>
                                    <div className="flex flex-col items-center mb-6">
                                        <label htmlFor="photo-upload-form" className="cursor-pointer">
                                            <div className="w-24 h-24 rounded-full bg-black/5 flex items-center justify-center border-2 border-dashed border-yellow-800/50 hover:bg-black/10 transition-colors">
                                                {photoPreview ? <img src={photoPreview} alt="Preview" className="w-full h-full rounded-full object-cover" /> : <UploadCloudIcon className="w-8 h-8 text-yellow-800/70" />}
                                            </div>
                                        </label>
                                        <input id="photo-upload-form" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                                    </div>
                                    <div className="relative w-full max-w-xs mb-8">
                                        <input
                                            type="text"
                                            value={birthdate}
                                            onChange={handleBirthdateChange}
                                            placeholder="생년월일 (YYYY-MM-DD)"
                                            maxLength="10"
                                            className="w-full p-2 text-center text-lg text-[#4a3f35] placeholder:text-yellow-800/50 bg-transparent focus:outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSubmit}
                                        className="px-12 py-3 bg-[#5d4037] text-[#f5e6c8] text-xl font-bold rounded-lg shadow-lg shadow-black/30 border border-black/20 hover:bg-[#795548] transition-all transform hover:scale-105 whitespace-nowrap"
                                    >
                                        전달하기
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default App;