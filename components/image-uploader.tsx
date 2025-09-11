"use client"

import React, { useCallback, useState, DragEvent } from 'react'
import { useNotifications } from './notification-system'

export interface ImageUploaderProps {
  mode: 'robot' | 'provider'
  onFilesSelected: (urls: string[]) => void
}

export default function ImageUploader() {
  // Custom image uploader removed. Use built-in converters instead.
  return null
}
