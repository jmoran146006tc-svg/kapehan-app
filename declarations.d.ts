declare module '*.css';
import 'lucide-react-native';
declare module 'lucide-react-native' {
  interface LucideProps {
    color?: string;
    className?: string;
  }
}