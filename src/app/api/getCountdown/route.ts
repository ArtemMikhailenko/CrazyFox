export default async function handler(req:any, res:any) {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
      const PRESALE_END_DATE = new Date('2025-09-18T00:00:00.000Z');
      const currentTime = new Date();
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
      
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.status(200).json(response);
      
    } catch (error) {
      console.error('Countdown API error:', error);
      res.status(500).json({
        error: 'Failed to get countdown data',
        endDate: new Date('2025-09-18T00:00:00.000Z').toISOString(),
        fallback: true
      });
    }
  }