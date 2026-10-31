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
  { id: 'thumbs_up', label: 'Thumbs Up', phrase: 'Yes, I agree.', confidence: 0.94, icon: '👍', category: 'affirmation' as const },
  { id: 'thumbs_down', label: 'Thumbs Down', phrase: 'No, I disagree.', confidence: 0.91, icon: '👎', category: 'negation' as const },
  { id: 'open_palm', label: 'Open Palm', phrase: 'Please wait a moment.', confidence: 0.88, icon: '✋', category: 'need' as const },
  { id: 'wave', label: 'Wave', phrase: 'Hello, good to see you.', confidence: 0.95, icon: '👋', category: 'social' as const },
  { id: 'pointing', label: 'Pointing', phrase: 'I need that one, please.', confidence: 0.84, icon: '👉', category: 'need' as const },
  { id: 'head_nod', label: 'Head Nod', phrase: 'Yes, absolutely.', confidence: 0.92, icon: '🙂', category: 'affirmation' as const },
  { id: 'head_shake', label: 'Head Shake', phrase: 'No, that is not right.', confidence: 0.89, icon: '😐', category: 'negation' as const },
];

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Live Conversation', href: '/conversation/new', icon: 'MessageSquare' },
  { label: 'Gesture Recognition', href: '/gesture', icon: 'Video' },
  { label: 'Conversation History', href: '/history', icon: 'History' },
  { label: 'Settings', href: '/settings', icon: 'Sliders' },
  { label: 'Profile', href: '/profile', icon: 'User' },
];

