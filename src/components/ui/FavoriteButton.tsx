import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface FavoriteButtonProps {
  isFavorited: boolean;
  onToggle: () => void;
  size?: number;
  className?: string;
}

export default function FavoriteButton({ isFavorited, onToggle, size = 20, className = '' }: FavoriteButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    onToggle();
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center justify-center transition-transform duration-200 active:scale-125 ${className}`}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        size={size}
        className={`transition-colors duration-200 ${
          isFavorited ? 'fill-red-500 text-red-500' : 'fill-none text-gray-400 hover:text-red-400'
        }`}
      />
    </button>
  );
}