/* Trading API service using native WebSocket (server is not Socket.IO) */

let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

export interface TradingInstrument {
  symbol: string;
  name: string;
  subtitle: string;
  price: string;
  change: string;
  changePercent: number;
  changeColor: string;
  icon: string;
  sparkline: number[];
  isFavorite: boolean;
}

const SOCKET_URL = 'ws://13.201.33.113:5000';

class TradingApiService {
  private socket: WebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: { [event: string]: Array<(payload: any) => void> } = {};
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  private isConnecting: boolean = false;

  initializeConnection() {
    if (this.socket && this.isConnected) {
      console.warn('⚠️ Socket already connected!');
      return;
    }

    if (this.isConnecting) {
      console.warn('⚠️ Connection already in progress!');
      return;
    }

    try {
      console.log('🔗 Initializing trading socket connection...');
      this.isConnecting = true;
      
      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        console.error('❌ Connection timeout after 10 seconds');
        this.handleConnectionError('Connection timeout');
      }, 10000);
      
      this.socket = new WebSocket(SOCKET_URL);

      this.socket.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('✅ Connected to Trading WebSocket server');
        
        // Send initial handshake message - server might expect this
        try {
          this.socket?.send(JSON.stringify({ 
            type: 'handshake', 
            client: 'react-native',
            version: '1.0.0',
            config: {
              limit: 0, // Request all data with no limit
              fullData: true
            }
          }));
          console.log('📤 Sent enhanced handshake message with no data limits');
        } catch (e) {
          console.warn('⚠️ Failed to send handshake:', e);
        }
      };

      this.socket.onerror = (event) => {
        console.error('❗ Trading WebSocket error:', event);
        // Log more details about the error
        if (this.socket) {
          console.log('Socket state:', this.socket.readyState);
        }
      };

      this.socket.onmessage = (event) => {
        console.log('📥 Raw message received:', event.data);
        try {
          const data = JSON.parse(event.data);
          console.log('📥 Parsed JSON:', data);
          
          // Normalize different possible payload shapes into 'tradingData'
          if (Array.isArray(data)) {
            console.log('📊 Emitting tradingData event with array');
            this.emitLocal('tradingData', data);
          } else if (data?.type === 'tradingData' && Array.isArray(data.payload)) {
            console.log('📊 Emitting tradingData event with payload');
            this.emitLocal('tradingData', data.payload);
          } else if (data?.symbol) {
            console.log(`📊 Emitting instrument_${data.symbol} event`);
            this.emitLocal(`instrument_${data.symbol}`, data);
          } else if (typeof data === 'object' && !Array.isArray(data)) {
            // Handle object format like {"EURUSD": {"bid": 1.17214, "ask": 1.1722, "last": 0.0}, ...}
            console.log('📊 Processing object format with multiple instruments');
            
            // Transform the object into an array of TradingInstrument objects
            const instruments: TradingInstrument[] = Object.entries(data).map(([symbol, details]: [string, any]) => {
              // Extract bid as the price
              const price = details.bid?.toString() || '0.0';
              
              // Create a random change percent for visualization
              const changePercent = (Math.random() * 2 - 1) * 0.5; // Random between -0.5% and +0.5%
              const isPositive = changePercent > 0;
              
              return {
                symbol,
                name: symbol,
                subtitle: getSubtitleForSymbol(symbol),
                price,
                change: `${isPositive ? '↑' : '↓'} ${Math.abs(changePercent).toFixed(2)}%`,
                changePercent,
                changeColor: isPositive ? '#1E90FF' : '#EF4444',
                icon: getIconForSymbol(symbol),
                sparkline: generateSparkline(isPositive),
                isFavorite: true
              };
            });
            
            console.log(`📊 Transformed ${instruments.length} instruments from object format`);
            this.emitLocal('tradingData', instruments);
          } else {
            console.log('⚠️ Unknown message format, ignoring');
          }
        } catch (err) {
          console.warn('⚠️ Non-JSON message from server:', event.data);
          // Check if it's a plain text message
          if (typeof event.data === 'string') {
            console.log('📝 Plain text message:', event.data);
          }
        }
      };

      this.socket.onclose = (event) => {
        this.isConnected = false;
        console.warn('⚡ Trading WebSocket closed:', event.code, event.reason);
        console.log('Close event details:', {
          code: event.code,
          reason: event.reason
        });
        
        // Don't reconnect on normal closure (1000) or going away (1001)
        if (event.code !== 1000 && event.code !== 1001) {
          this.tryReconnect();
        }
      };
    } catch (error) {
      console.error('❗ Failed to initialize trading socket:', error);
      this.tryReconnect();
    }
  }

  private tryReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached');
      return;
    }
    this.reconnectAttempts += 1;
    const delayMs = 1000 * this.reconnectAttempts;
    console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delayMs}ms`);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => this.initializeConnection(), delayMs);
  }

  disconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (this.socket) {
      console.log('❗ Disconnecting trading socket...');
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onerror = null;
      this.socket.onclose = null;
      try { 
        this.socket.close(1000, 'Client disconnecting'); 
      } catch {}
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Event helpers
  private onLocal(event: string, callback: (payload: any) => void) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  private offLocal(event: string) {
    if (this.listeners[event]) delete this.listeners[event];
  }

  private emitLocal(event: string, payload: any) {
    const callbacks = this.listeners[event] || [];
    console.log(`📡 Emitting local event: ${event} to ${callbacks.length} listeners`);
    callbacks.forEach(cb => {
      try { cb(payload); } catch (e) { console.error('Listener error', e); }
    });
  }

  // Public API compatible with previous usage
  subscribeToTradingData(callback: (data: TradingInstrument[]) => void) {
    console.log('👂 Subscribing to tradingData events');
    
    // Wrap the callback to ensure we're not limiting the data
    const wrappedCallback = (data: TradingInstrument[]) => {
      console.log(`📊 Received ${data.length} trading instruments`);
      callback(data);
    };
    
    this.onLocal('tradingData', wrappedCallback);
    
    // If connected, request data
    if (this.isConnected) {
      try {
        this.socket?.send(JSON.stringify({ action: 'getTradingData', limit: 0 })); // Request all data with no limit
        console.log('📤 Sent getTradingData request with no limit');
      } catch (e) {
        console.warn('⚠️ Failed to send getTradingData:', e);
      }
    }
  }

  subscribeToInstrument(symbol: string, callback: (data: TradingInstrument) => void) {
    console.log(`👂 Subscribing to instrument_${symbol} events`);
    this.onLocal(`instrument_${symbol}`, callback);
    
    if (this.isConnected) {
      try {
        this.socket?.send(JSON.stringify({ action: 'subscribeInstrument', symbol }));
        console.log(`📤 Sent subscribeInstrument for ${symbol}`);
      } catch (e) {
        console.warn(`⚠️ Failed to send subscribeInstrument for ${symbol}:`, e);
      }
    }
  }

  unsubscribeFromInstrument(symbol: string) {
    console.log(`❌ Unsubscribing from instrument_${symbol}`);
    this.offLocal(`instrument_${symbol}`);
    
    if (this.isConnected) {
      try {
        this.socket?.send(JSON.stringify({ action: 'unsubscribeInstrument', symbol }));
        console.log(`📤 Sent unsubscribeInstrument for ${symbol}`);
      } catch (e) {
        console.warn(`⚠️ Failed to send unsubscribeInstrument for ${symbol}:`, e);
      }
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  removeAllListeners() {
    console.log('🧹 Removing all listeners');
    this.listeners = {};
  }
}

// Helper functions for transforming data
function getSubtitleForSymbol(symbol: string): string {
  const subtitles: {[key: string]: string} = {
    'EURUSD': 'Euro vs US Dollar',
    'GBPUSD': 'Great Britain Pound vs US Dollar',
    'BTCUSD': 'Bitcoin vs US Dollar',
    'USDJPY': 'US Dollar vs Japanese Yen',
    'USTEC': 'US Tech 100 Index',
    'ETHUSD': 'Ethereum vs US Dollar',
    'GBPJPY': 'Great Britain Pound vs Japanese Yen',
    'USDCAD': 'US Dollar vs Canadian Dollar',
    'USOIL': 'US Crude Oil',
    'XAUUSD': 'Gold vs US Dollar'
  };
  
  return subtitles[symbol] || `${symbol} Instrument`;
}

function getIconForSymbol(symbol: string): string {
  if (symbol.includes('BTC') || symbol.includes('ETH')) return 'bitcoin';
  if (symbol.includes('USTEC')) return 'trending-up';
  if (symbol.includes('AAPL')) return 'apple';
  return 'flag';
}

function generateSparkline(isPositive: boolean): number[] {
  const baseValue = 100;
  const sparkline: number[] = [];
  
  for (let i = 0; i < 12; i++) {
    if (isPositive) {
      sparkline.push(baseValue + i + Math.random() * 2);
    } else {
      sparkline.push(baseValue - i - Math.random() * 2);
    }
  }
  
  return sparkline;
}

export default new TradingApiService();
