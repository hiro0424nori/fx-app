import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [currencyPair, setCurrencyPair] = useState('USDJPY');
  const [direction, setDirection] = useState('long');
  const [entryPrice, setEntryPrice] = useState('');
  const [decimalPlaces, setDecimalPlaces] = useState(2);
  const [atr, setAtr] = useState(null);
  const [stopLoss, setStopLoss] = useState(null);
  const [takeProfit, setTakeProfit] = useState(null);
  const [error, setError] = useState('');

  const apiKey = 'QCSHZXZP6PJ3LOXR';

  const currencyPairs = [
    'USDJPY', 'EURJPY', 'EURUSD', 'GBPUSD', 'AUDUSD', 'NZDUSD', 'USDCHF'
  ];

  useEffect(() => {
    if (currencyPair) {
      fetchATR(currencyPair);
      if (currencyPair.endsWith('JPY')) {
        setDecimalPlaces(2);
      } else {
        setDecimalPlaces(4);
      }
    }
  }, [currencyPair]);

  const fetchATR = async (pair) => {
    const fromSymbol = pair.slice(0, 3);
    const toSymbol = pair.slice(3);
    const url = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${fromSymbol}&to_symbol=${toSymbol}&apikey=${apiKey}`;

    try {
      const response = await axios.get(url);
      const data = response.data["Time Series FX (Daily)"];
      if (!data) throw new Error('データが取得できません（API制限の可能性あり）');

      const dates = Object.keys(data).sort().reverse();
      const highs = dates.slice(0, 14).map(date => parseFloat(data[date]['2. high']));
      const lows = dates.slice(0, 14).map(date => parseFloat(data[date]['3. low']));

      if (highs.length < 14 || lows.length < 14) {
        throw new Error('データ数が不足しています');
      }

      let trList = [];
      for (let i = 0; i < 14; i++) {
        const tr = highs[i] - lows[i];
        trList.push(tr);
      }

      const atrValue = trList.reduce((sum, tr) => sum + tr, 0) / trList.length;
      setAtr(atrValue.toFixed(decimalPlaces));
    } catch (err) {
      setError(err.message);
      setAtr(null);
    }
  };

  const calculatePrices = () => {
    const price = parseFloat(entryPrice);
    const atrValue = parseFloat(atr);

    if (isNaN(price) || isNaN(atrValue)) {
      setError('有効な価格またはATRを入力してください');
      return;
    }

    const riskRewardRatio = 2; // 利益：損失 = 2:1
    let sl, tp;

    if (direction === 'long') {
      sl = price - atrValue;
      tp = price + atrValue * riskRewardRatio;
    } else {
      sl = price + atrValue;
      tp = price - atrValue * riskRewardRatio;
    }

    setStopLoss(sl.toFixed(decimalPlaces));
    setTakeProfit(tp.toFixed(decimalPlaces));
    setError('');
  };

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h2>FX PR比計算ツール</h2>

      <div>
        <label>通貨ペア：</label>
        <select value={currencyPair} onChange={(e) => setCurrencyPair(e.target.value)}>
          {currencyPairs.map((pair) => (
            <option key={pair} value={pair}>{pair}</option>
          ))}
        </select>
      </div>

      <div>
        <label>方向：</label>
        <select value={direction} onChange={(e) => setDirection(e.target.value)}>
          <option value="long">ロング（買い）</option>
          <option value="short">ショート（売り）</option>
        </select>
      </div>

      <div>
        <label>エントリー価格：</label>
        <input
          type="text"
          value={entryPrice}
          onChange={(e) => setEntryPrice(e.target.value)}
        />
      </div>

      <div>
        <button onClick={calculatePrices}>損切り・利確計算</button>
      </div>

      {atr && (
        <div>現在のATR：{atr}</div>
      )}
      {stopLoss && (
        <div>損切り価格（SL）：{stopLoss}</div>
      )}
      {takeProfit && (
        <div>利確価格（TP）：{takeProfit}</div>
      )}
      {error && (
        <div style={{ color: 'red' }}>{error}</div>
      )}
    </div>
  );
};

export default App;
