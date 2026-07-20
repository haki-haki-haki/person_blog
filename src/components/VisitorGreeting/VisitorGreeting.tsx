import { useEffect, useState } from 'react';
import { MapPin, Clock } from 'lucide-react';
import './visitor-greeting.css';

type VisitorInfo = {
  city: string;
  region: string;
  timezone: string;
};

const VisitorGreeting = () => {
  const [visitor, setVisitor] = useState<VisitorInfo | null>(null);
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(true);

  // 获取访问者 IP 地理位置
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        // 使用免费 IP 定位 API（无需 key，支持国内外）
        const res = await fetch('https://ipwho.is/');
        const data = await res.json();
        if (data.success !== false) {
          setVisitor({
            city: data.city || '',
            region: data.region || '',
            timezone: data.timezone?.id || '',
          });
        }
      } catch {
        // 定位失败则静默处理
      } finally {
        setLoading(false);
      }
    };
    fetchLocation();
  }, []);

  // 每秒更新时间
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = now.getHours();

      // 根据访问者时区格式化，没有时区信息则用本地时间
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: visitor?.timezone || undefined,
      };
      const timeStr = now.toLocaleTimeString('zh-CN', options);
      setTime(timeStr);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [visitor?.timezone]);

  // 根据小时生成问候语
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 9) return '早上好';
    if (h >= 9 && h < 12) return '上午好';
    if (h >= 12 && h < 14) return '中午好';
    if (h >= 14 && h < 18) return '下午好';
    if (h >= 18 && h < 22) return '晚上好';
    return '夜深了';
  };

  // 定位中不显示，失败也不显示（静默降级）
  if (loading || (!visitor && !loading)) return null;

  const locationText = visitor
    ? [visitor.city, visitor.region].filter(Boolean).join(' · ')
    : '';

  return (
    <div className="visitor-greeting">
      <div className="greeting-line">
        <span className="greeting-text">{getGreeting()}，欢迎来到我的博客</span>
      </div>
      <div className="greeting-meta">
        {locationText && (
          <span className="greeting-tag">
            <MapPin size={12} />
            {locationText}
          </span>
        )}
        <span className="greeting-tag">
          <Clock size={12} />
          {time}
        </span>
      </div>
    </div>
  );
};

export default VisitorGreeting;
