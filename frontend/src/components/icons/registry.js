/**
 * Icon Registry
 * Centralized icon mapping using lucide-react.
 * Maps semantic names to icon components for consistent usage.
 */

import {
  // Navigation
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,

  // User & Auth
  User,
  LogIn,
  LogOut,
  UserPlus,
  UserCheck,
  Shield,
  Key,

  // Shopping
  ShoppingCart,
  ShoppingBag,
  Heart,
  HeartOff,
  CreditCard,
  Truck,
  Package,
  Tag,
  Percent,
  Gift,

  // Actions
  Search,
  Filter,
  Settings,
  Edit,
  Trash2,
  Plus,
  Minus,
  Save,
  Download,
  Upload,
  Copy,
  Share2,
  RefreshCw,
  RotateCcw,

  // Status
  Check,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
  Clock,
  Calendar,

  // Layout
  Grid,
  List,
  Layers,
  Sidebar,
  Home,

  // Admin
  Users,
  Box,
  Receipt,
  BarChart2,
  FileText,
  Mail,
  Bell,
  Flag,

  // E-commerce specific
  Star,
  StarHalf,
  Eye,
  EyeOff,
  Image,
  Camera,
  Zap,
  Lock,
  Unlock,
  Globe,
  Languages,
  Sun,
  Moon,
} from 'lucide-react';

export const icons = {
  // Navigation
  menu: Menu,
  close: X,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,

  // User & Auth
  user: User,
  login: LogIn,
  logout: LogOut,
  register: UserPlus,
  verified: UserCheck,
  admin: Shield,
  password: Key,

  // Shopping
  cart: ShoppingCart,
  bag: ShoppingBag,
  wishlist: Heart,
  wishlistOff: HeartOff,
  payment: CreditCard,
  shipping: Truck,
  package: Package,
  tag: Tag,
  discount: Percent,
  offer: Gift,

  // Actions
  search: Search,
  filter: Filter,
  settings: Settings,
  edit: Edit,
  delete: Trash2,
  add: Plus,
  remove: Minus,
  save: Save,
  download: Download,
  upload: Upload,
  copy: Copy,
  share: Share2,
  refresh: RefreshCw,
  undo: RotateCcw,

  // Status
  check: Check,
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
  time: Clock,
  calendar: Calendar,

  // Layout
  grid: Grid,
  list: List,
  layers: Layers,
  sidebar: Sidebar,
  home: Home,

  // Admin
  users: Users,
  products: Box,
  orders: Receipt,
  analytics: BarChart2,
  documents: FileText,
  email: Mail,
  notifications: Bell,
  flag: Flag,

  // E-commerce specific
  star: Star,
  starHalf: StarHalf,
  view: Eye,
  viewOff: EyeOff,
  image: Image,
  camera: Camera,
  featured: Zap,
  lock: Lock,
  unlock: Unlock,
  globe: Globe,
  languages: Languages,
  sun: Sun,
  moon: Moon,
};

export function getIcon(name) {
  return icons[name] || null;
}

export function createIconComponent(name, props = {}) {
  const Icon = icons[name];
  if (!Icon) return null;
  return <Icon {...props} />;
}

export const iconProps = {
  size: 20,
  strokeWidth: 2,
  'aria-hidden': 'true',
};

export const iconSizes = {
  xs: 14,
  sm: 18,
  md: 20,
  lg: 24,
  xl: 28,
  '2xl': 32,
};