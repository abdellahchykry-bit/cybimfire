"use client";

import { useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';
import type { Orientation } from '@/lib/types';

function setOrientationWithCSS(orientation: Orientation) {
    const body = document.body;
    const classMap = {
      'landscape': '',
      'reverse-landscape': 'orientation-reverse-landscape',
      'portrait': 'orientation-portrait',
      'reverse-portrait': 'orientation-reverse-portrait',
    };
    
    // Remove all possible orientation classes
    Object.values(classMap).forEach(cls => {
      if (cls && body.classList.contains(cls)) {
        body.classList.remove(cls);
      }
    });
    
    // Add the current one
    const newClass = classMap[orientation];
    if (newClass) {
      body.classList.add(newClass);
    }
}

export default function OrientationManager() {
  const { settings, loaded } = useSettings();

  useEffect(() => {
    if (loaded) {
        setOrientationWithCSS(settings.orientation);
    }
  }, [settings.orientation, loaded]);

  return null;
}
