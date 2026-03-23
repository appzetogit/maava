import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, X } from "lucide-react"

const VoiceSearchModal = ({ isOpen, onClose, onResult }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [errorStatus, setErrorStatus] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setIsListening(false);
      setTranscript("");
      setErrorStatus(null);
      return;
    }

    // --- FLUTTER BRIDGE SUPPORT START ---
    // Make a global function available for Flutter to call with the result
    window.onFlutterVoiceResult = (text) => {
      if (text) {
        setTranscript(text);
        onResult(text);
        setTimeout(onClose, 800);
      } else {
        setIsListening(false);
        setErrorStatus("No speech detected");
      }
    };

    window.onFlutterVoiceError = (errorMsg) => {
      setIsListening(false);
      setErrorStatus(errorMsg || "Voice search failed on mobile");
    };

    // Check if the app is running inside a Flutter WebView with a dedicated channel
    if (window.VoiceSearchChannel) {
      setIsListening(true);
      setErrorStatus(null);
      window.VoiceSearchChannel.postMessage("startVoiceSearch");
      return; // Skip Web Speech API
    }

    // Alternative: check for flutter_inappwebview
    if (window.flutter_inappwebview && window.flutter_inappwebview.callHandler) {
      setIsListening(true);
      setErrorStatus(null);
      window.flutter_inappwebview.callHandler('startVoiceSearch').then((result) => {
        if (result) {
          window.onFlutterVoiceResult(result);
        }
      }).catch((e) => {
        window.onFlutterVoiceError("Voice search failed");
      });
      return; // Skip Web Speech API
    }
    // --- FLUTTER BRIDGE SUPPORT END ---

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorStatus("Speech recognition not supported");
      console.error("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setErrorStatus(null);
    };

    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const resultTranscript = event.results[current][0].transcript;
      setTranscript(resultTranscript);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (transcript && !errorStatus) {
        onResult(transcript);
        // Delay closing slightly so user can see what was captured
        setTimeout(onClose, 800);
      }
    };

    recognition.onerror = (event) => {
      // Don't log aborted error as it's common when stopping it normally
      if (event.error !== 'aborted') {
        console.error("Speech recognition error", event.error);
      }
      setIsListening(false);

      if (event.error === 'not-allowed') {
        setErrorStatus("Microphone access denied. Please enable it in your browser settings.");
      } else if (event.error === 'no-speech') {
        setErrorStatus("No speech detected. Try again.");
      } else if (event.error === 'network') {
        setErrorStatus("Network error. Please check your connection.");
      } else if (event.error !== 'aborted') {
        setErrorStatus("An error occurred. Please try again.");
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition", e);
      setErrorStatus("Failed to start voice search");
    }

    return () => {
      recognition.stop();
    };
  }, [isOpen, onClose, onResult, transcript, errorStatus]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-white rounded-[2.5rem] p-8 flex flex-col items-center relative overflow-hidden shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>

            <div className="text-xl font-medium text-gray-400 mb-12 flex items-center gap-1">
              <span className="text-blue-500 font-bold">G</span>
              <span className="text-red-500 font-bold">o</span>
              <span className="text-yellow-500 font-bold">o</span>
              <span className="text-blue-500 font-bold">g</span>
              <span className="text-green-500 font-bold">l</span>
              <span className="text-red-500 font-bold">e</span>
            </div>

            <div className="relative mb-12">
              {/* Pulsing rings */}
              {isListening && !errorStatus && (
                <>
                  <motion.div
                    animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 bg-blue-100 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                    className="absolute inset-0 bg-blue-50 rounded-full"
                  />
                </>
              )}

              <div className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-colors ${errorStatus ? 'bg-red-400 shadow-red-100' : 'bg-blue-500 shadow-blue-200'}`}>
                <Mic size={40} className="text-white" strokeWidth={2.5} />
              </div>
            </div>

            <h2 className={`text-2xl font-semibold mb-3 text-center px-4 ${errorStatus ? 'text-red-500' : (transcript ? 'text-gray-800' : 'text-gray-400')}`}>
              {errorStatus || transcript || "Speak now"}
            </h2>

            <p className="text-gray-400 text-lg mb-12 font-medium">
              {errorStatus ? "Permission Required" : "English (United States)"}
            </p>

            <div className="w-full bg-gray-50 rounded-3xl p-6 text-center border border-gray-100">
              <p className="text-gray-500 text-sm leading-relaxed font-medium">
                {errorStatus
                  ? "To use voice search, please click the camera/mic icon in your address bar and allow microphone access."
                  : "Google Speech Services converts audio to text and shares the text with this app."}
              </p>
            </div>

            {errorStatus && (
              <button
                onClick={onClose}
                className="mt-6 w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-colors"
              >
                Got it
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VoiceSearchModal;
