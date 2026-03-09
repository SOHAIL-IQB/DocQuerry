import React from 'react';
import { User, Bot, Smile, Star, Zap, Hexagon, Heart, Cpu } from 'lucide-react';

export const AVATAR_MAP = {
  avatar1: User,
  avatar2: Bot,
  avatar3: Smile,
  avatar4: Star,
  avatar5: Zap,
  avatar6: Hexagon,
  avatar7: Heart,
  avatar8: Cpu,
};

const AvatarIcon = ({ avatarId, size = 18, className = '', ...props }) => {
  const Icon = AVATAR_MAP[avatarId] || User;
  return <Icon size={size} className={className} {...props} />;
};

export default AvatarIcon;
