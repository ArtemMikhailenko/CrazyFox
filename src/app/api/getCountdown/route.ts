// src/app/api/getCountdown/route.ts
import { NextRequest, NextResponse } from 'next/server';

// ФИКСИРОВАННАЯ ДАТА ОКОНЧАНИЯ (одинакова для всех пользователей)
const PRESALE_END_DATE = new Date('2025-09-18T00:00:00.000Z'); // 90 дней с 20 июня 2025

export async function GET(request: NextRequest) {
  try {
    // Текущее серверное время
    const currentTime = new Date();
    
    // Рассчитываем оставшееся время
    const timeRemaining = PRESALE_END_DATE.getTime() - currentTime.getTime();
    
    const response = {
      endDate: PRESALE_END_DATE.toISOString(),
      currentServerTime: currentTime.toISOString(),
      timeRemaining: Math.max(0, timeRemaining),
      days: Math.floor(Math.max(0, timeRemaining) / (1000 * 60 * 60 * 24)),
      hours: Math.floor((Math.max(0, timeRemaining) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((Math.max(0, timeRemaining) % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((Math.max(0, timeRemaining) % (1000 * 60)) / 1000),
      isActive: timeRemaining > 0,
      timezone: 'UTC'
    };
    
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('Countdown API error:', error);
    
    return NextResponse.json({
      error: 'Failed to get countdown data',
      endDate: PRESALE_END_DATE.toISOString(),
      fallback: true
    }, {
      status: 500
    });
  }
}

// Опционально: добавить POST метод если нужно
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}