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


// ==================================================================
// --- 🔮 점쟁이 방 장면 컴포넌트 (디자인 최종 수정) ---
// ==================================================================
const FortuneTellerScene = ({ userPhoto, birthdate }) => {
    const [dialogue, setDialogue] = useState('');

    const doorOpenSoundRef = useRef(null);
    const doorCloseSoundRef = useRef(null);

    useEffect(() => {
        const timers = [];
        timers.push(setTimeout(() => { doorOpenSoundRef.current?.play().catch(e => {}); }, 500));
        timers.push(setTimeout(() => { doorCloseSoundRef.current?.play().catch(e => {}); }, 1500));
        timers.push(setTimeout(() => { setDialogue("앞에 편하게 앉아"); }, 3000));
        return () => timers.forEach(clearTimeout);
    }, []);

    return (
        <div className="w-full h-screen bg-black overflow-hidden relative flex items-center justify-center font-gowun animate-[fade-in_1s_ease-in-out]">
            <style>{`
                @keyframes flicker-effect {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 0.8;
                    }
                    50% {
                        transform: scale(1.03);
                        opacity: 1;
                    }
                }
                .flickering-element {
                    animation: flicker-effect 3s infinite ease-in-out;
                }
            `}</style>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
            
            {/* 점쟁이 실루엣 SVG (새로운 경로와 그라데이션 적용) */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 max-w-sm flickering-element" style={{animationDelay: '0.1s'}}>
                <svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="silhouetteGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style={{stopColor: '#4a4a4a'}} />
                            <stop offset="100%" style={{stopColor: '#1a1a1a'}} />
                        </linearGradient>
                    </defs>
                    <path fill="url(#silhouetteGradient)" d="M100,22.5c-12.2,0-22.1,9.9-22.1,22.1s9.9,22.1,22.1,22.1s22.1-9.9,22.1-22.1S112.2,22.5,100,22.5z M144.4,90.3 c-6.4-3.1-15.1-4.9-24.4-4.9h-40c-9.4,0-18,1.8-24.4,4.9C33,98.1,17.9,122.2,17.9,150.1v3.8c0,14.2,36.8,25.8,82.1,25.8 s82.1-11.5,82.1-25.8v-3.8C182.1,122.2,167,98.1,144.4,90.3z"/>
                </svg>
            </div>

            {/* 호롱불 SVG */}
            <div className="absolute bottom-5 left-2 md:left-10 w-48 h-48 flickering-element">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <radialGradient id="lanternGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                            <stop offset="0%" style={{stopColor: '#ffefc4', stopOpacity: 0.9}} />
                            <stop offset="30%" style={{stopColor: '#ffc94d', stopOpacity: 0.6}} />
                            <stop offset="100%" style={{stopColor: '#ff7b24', stopOpacity: 0}} />
                        </radialGradient>
                    </defs>
                    <circle cx="50" cy="50" r="50" fill="url(#lanternGlow)" />
                    <path d="M40 90 L60 90 L65 70 L35 70 Z" fill="#2b2b2b" />
                    <rect x="30" y="68" width="40" height="5" fill="#333" />
                </svg>
            </div>
            
            {/* 천막(장막) 효과 */}
            <div 
                className="absolute inset-0 z-10" 
                style={{
                    backgroundImage: "url('https://www.transparenttextures.com/patterns/fabric-of-squares.png')",
                    backdropFilter: "blur(2px)",
                    opacity: 0.5
                }}
            ></div>

            {/* 거울 (z-index 추가) */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-48 h-64 bg-black/50 border-2 border-yellow-700/50 rounded-lg shadow-2xl p-4 flex flex-col items-center justify-center space-y-4 z-20">
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-yellow-800">
                    <img src={userPhoto} alt="사용자 사진" className="w-full h-full object-cover" />
                </div>
                <p className="text-white text-lg tracking-wider">{birthdate}</p>
            </div>

            {/* 대사 자막 창 (z-index 추가) */}
            {dialogue && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-11/12 max-w-3xl bg-black/70 p-4 rounded-lg text-center animate-[fade-in_0.5s_ease-out] z-20">
                    <p className="text-white text-2xl">{dialogue}</p>
                </div>
            )}
            
            <audio ref={doorOpenSoundRef} src="/assets/sounds/door-open.mp3" preload="auto"></audio>
            <audio ref={doorCloseSoundRef} src="/assets/sounds/door-close.mp3" preload="auto"></audio>
        </div>
    );
};


// ==================================================================
// --- ✨ 메인 앱 컴포넌트 ---
// ==================================================================
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
    const [isBubbleShown, setIsBubbleShown] = useState(false);
    const [showLoadingBubble, setShowLoadingBubble] = useState(false);

    const wasBubbleShowingRef = useRef(isBubbleShown);
    useEffect(() => {
        wasBubbleShowingRef.current = isBubbleShown;
    }, [isBubbleShown]);

    const formBottomOffset = 20;
    const formWidthPercent = 80;
    const initialDialogueDelay = 1000;
    const FADE_DURATION = 300; 
    const SCROLL_APPEAR_DELAY = 500;

    useEffect(() => {
        const imagePaths = [ ...apprenticeSequence.map(s => s.image), '/scroll-unfurled.png', '/scroll-rolled.png' ];
        const preloadImages = (paths) => Promise.all(paths.map(path => new Promise(resolve => {
            const img = new Image(); img.src = path; img.onload = resolve; img.onerror = resolve;
        })));
        const imagePromise = preloadImages(imagePaths);
        const minTimePromise = new Promise(resolve => setTimeout(resolve, 3000));
        Promise.all([imagePromise, minTimePromise]).then(() => { setAppPhase('intro'); });
        const loadingBubbleTimer = setTimeout(() => { setShowLoadingBubble(true); }, 1500);
        return () => clearTimeout(loadingBubbleTimer);
    }, []);

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

    useEffect(() => {
        if (appPhase !== 'intro' || !animationState.showApprentice) return;
        const scene = apprenticeSequence[sequenceStep];
        if (!scene) return;
        const allTimers = [];
        if (wasBubbleShowingRef.current) { setIsBubbleShown(false); }
        const contentUpdateTimer = setTimeout(() => {
            setDisplayedDialogues([]); 
            let typingDelay = 0;
            scene.dialogue.forEach((dialogue, index) => {
                const typingTimer = setTimeout(() => {
                    if (index === 0) { setIsBubbleShown(true); }
                    setDisplayedDialogues(prev => [...prev, dialogue]);
                    if (sequenceStep === apprenticeSequence.length - 1 && index === scene.dialogue.length - 1) {
                        const scrollTimer = setTimeout(() => { setIsFinalDialogueFinished(true); }, SCROLL_APPEAR_DELAY);
                        allTimers.push(scrollTimer);
                    }
                }, typingDelay);
                typingDelay += 800;
                allTimers.push(typingTimer);
            });
        }, wasBubbleShowingRef.current ? FADE_DURATION : initialDialogueDelay);
        allTimers.push(contentUpdateTimer);
        return () => allTimers.forEach(clearTimeout);
    }, [sequenceStep, animationState.showApprentice, appPhase]);

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
        setAppPhase('fortuneTeller');
    };

    const handleBirthdateChange = (e) => {
        let value = e.target.value.replace(/[^\d]/g, '');
        if (value.length > 8) { value = value.slice(0, 8); }
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
                .responsive-title { font-size: clamp(2rem, 8.5vw, 3rem); }
                @media (min-width: 768px) { .responsive-title { font-size: 3.75rem; } }
                @media (max-width: 768px) {
                    .apprentice-container { right: -40px; }
                    .dialogue-bubble { left: -200px; width: 190px; }
                }
            `}</style>
            <BGMPlayer />

            {appPhase !== 'fortuneTeller' && <>
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/50 to-black z-0"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 z-0" />
            </>}
            
            {appPhase === 'loading' && showLoadingBubble && (
                 <div className="absolute bottom-40 right-5 z-10 animate-pulse">
                    <div className="relative w-56 p-4 bg-white text-gray-800 rounded-xl shadow-2xl">
                        <p className="font-bold text-lg">잠시만요 나가고 있어요!</p>
                        <div className="absolute top-1/2 -translate-y-1/2 right-[-5px] w-0 h-0 border-y-[10px] border-y-transparent border-l-[10px] border-l-white"></div>
                    </div>
                 </div>
            )}

            {appPhase === 'intro' && (
                <>
                    <div className={`absolute top-[18%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white transition-all duration-1000 ${animationState.showTitle ? 'opacity-100' : 'opacity-0 -translate-y-10'}`}>
                        <h1 className="responsive-title font-black font-gaegu mb-4 text-shadow-lg">AI 운명 비기</h1>
                    </div>
                    <div className={`absolute top-[18%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white transition-all duration-1000 delay-500 mt-20 ${animationState.showSubtitle ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
                        <p className="text-xl md:text-2xl text-indigo-200 text-shadow">운명의 실타래를 풀어, 그대의 길을 밝혀드립니다.</p>
                    </div>
                    <div className={`apprentice-container absolute bottom-0 right-0 transition-transform duration-1000 ease-out ${animationState.showApprentice ? 'translate-x-0' : 'translate-x-full'}`}>
                        <img key={apprenticeSequence[sequenceStep].image} src={apprenticeSequence[sequenceStep].image} alt="점쟁이 제자" className="w-[200px] h-[320px] md:w-[250px] md:h-[400px] object-contain drop-shadow-2xl apprentice-image-fade-in" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/250x400/000000/FFFFFF?text=이미지오류'; }} />
                        <div className={`dialogue-bubble absolute top-40 md:top-20 -left-56 w-56 p-4 bg-white text-gray-800 rounded-xl shadow-2xl transition-opacity duration-300 ${isBubbleShown ? 'opacity-100' : 'opacity-0'}`}>
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
                                        <input type="text" value={birthdate} onChange={handleBirthdateChange} placeholder="생년월일 (YYYY-MM-DD)" maxLength="10" className="w-full p-2 text-center text-lg text-[#4a3f35] placeholder:text-yellow-800/50 bg-transparent focus:outline-none" />
                                    </div>
                                    <button onClick={handleSubmit} className="px-12 py-3 bg-[#5d4037] text-[#f5e6c8] text-xl font-bold rounded-lg shadow-lg shadow-black/30 border border-black/20 hover:bg-[#795548] transition-all transform hover:scale-105 whitespace-nowrap">
                                        전달하기
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {appPhase === 'fortuneTeller' && (
                <FortuneTellerScene 
                    userPhoto={photoPreview}
                    birthdate={birthdate}
                />
            )}
        </div>
    );
}

export default App;