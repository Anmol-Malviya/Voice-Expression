import { QuickPhrase, LanguageOption } from '@/types';

export const APP_NAME = 'VoiceExpression';
export const APP_TAGLINE = 'Multimodal Live Conversation Assistant';

export const DEFAULT_QUICK_PHRASES: QuickPhrase[] = [
  // Basic
  { id: 'qp_basic_1', category: 'Basic', text: 'Yes.', color: 'emerald' },
  { id: 'qp_basic_2', category: 'Basic', text: 'No.', color: 'rose' },
  { id: 'qp_basic_3', category: 'Basic', text: 'Please wait.', color: 'amber' },
  { id: 'qp_basic_4', category: 'Basic', text: 'Thank you.', color: 'indigo' },

  // Needs
  { id: 'qp_needs_1', category: 'Needs', text: 'I want water.', color: 'blue' },
  { id: 'qp_needs_2', category: 'Needs', text: 'I need some rest.', color: 'purple' },
  { id: 'qp_needs_3', category: 'Needs', text: 'I want to go outside.', color: 'teal' },

  // Emergency
  { id: 'qp_emerg_1', category: 'Emergency', text: 'I need help.', color: 'red' },
  { id: 'qp_emerg_2', category: 'Emergency', text: 'I am not feeling well.', color: 'rose' },

  // Feelings
  { id: 'qp_feel_1', category: 'Feelings', text: 'I am comfortable.', color: 'emerald' },
  { id: 'qp_feel_2', category: 'Feelings', text: 'I feel tired.', color: 'amber' },

  // Social
  { id: 'qp_soc_1', category: 'Social', text: 'Hello, good to see you.', color: 'indigo' },
  { id: 'qp_soc_2', category: 'Social', text: 'Please repeat that.', color: 'sky' },
];

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'hi-en', name: 'Hinglish', nativeName: 'Hinglish', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
];

export const GESTURE_DICTIONARY = [
  { id: 'open_palm', label: 'Open Palm', phrase: 'Hello', confidence: 0.91, icon: '✋', category: 'social' as const, description: 'Open hand with fingers extended forward' },
  { id: 'closed_fist', label: 'Closed Fist', phrase: 'Stop', confidence: 0.93, icon: '✊', category: 'negation' as const, description: 'All fingers contracted firmly into palm' },
  { id: 'thumbs_up', label: 'Thumbs Up', phrase: 'Yes', confidence: 0.94, icon: '👍', category: 'affirmation' as const, description: 'Thumb pointing upward indicating agreement' },
  { id: 'thumbs_down', label: 'Thumbs Down', phrase: 'No', confidence: 0.92, icon: '👎', category: 'negation' as const, description: 'Thumb pointing downward indicating disagreement' },
  { id: 'pointing', label: 'Pointing', phrase: 'I need something', confidence: 0.90, icon: '👉', category: 'need' as const, description: 'Index finger extended directing attention' },
  { id: 'peace_sign', label: 'Peace Sign', phrase: 'Thank you', confidence: 0.92, icon: '✌️', category: 'social' as const, description: 'Index and middle fingers extended in V formation' },
  { id: 'stop_gesture', label: 'Stop Gesture', phrase: 'Please wait', confidence: 0.92, icon: '🛑', category: 'need' as const, description: 'Upright raised palm indicating wait or stop' },
  { id: 'wave', label: 'Wave', phrase: 'Hello, how are you?', confidence: 0.95, icon: '👋', category: 'social' as const, description: 'Lateral hand waving gesture indicating greeting' },
];

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Live Conversation', href: '/conversation/new', icon: 'MessageSquare' },
  { label: 'Gesture Recognition', href: '/gesture', icon: 'Video' },
  { label: 'Conversation History', href: '/history', icon: 'History' },
  { label: 'Settings', href: '/settings', icon: 'Sliders' },
  { label: 'Profile', href: '/profile', icon: 'User' },
];

