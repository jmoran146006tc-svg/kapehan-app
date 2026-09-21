declare module '*.css';
declare module '*.png' {
  const source: string;
  export default source;
}
import 'lucide-react-native';
declare module 'lucide-react-native' {
  interface LucideProps {
    color?: string;
    className?: string;
    fill?: string;
    strokeWidth?: number;
  }
}
