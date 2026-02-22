"use client";

import { useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';

export default function OrientationManager() {
  const { settings, loaded } = useSettings();

  useEffect(() => {
    if (loaded) {
      const classMap = {
        'landscape': 'orientation-landscape',
        'reverse-landscape': 'orientation-reverse-landscape',
        'portrait': 'orientation-portrait',
        'reverse-portrait': 'orientation-reverse-portrait',
      };
      
      // Remove all possible orientation classes from the html element
      Object.values(classMap).forEach(cls => document.documentElement.classList.remove(cls));
      
      // Add the current one
      const newClass = classMap[settings.orientation];
      if (newClass && newClass !== 'orientation-landscape') { // landscape is default, no class needed
        document.documentElement.classList.add(newClass);
      }
    }
  }, [settings.orientation, loaded]);

  return null; // This component doesn't render anything
}
