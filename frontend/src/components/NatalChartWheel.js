import React from 'react';

const NatalChartWheel = ({ chart }) => {
  const width = 600;
  const height = 600;
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = 280;
  const innerRadius = 200;
  const houseRadius = 160;
  const planetRadius = 220;

  // Zodiac signs with symbols
  const zodiacSigns = [
    { name: 'Овен', symbol: '♈', color: '#ef4444' },
    { name: 'Телець', symbol: '♉', color: '#84cc16' },
    { name: 'Близнюки', symbol: '♊', color: '#eab308' },
    { name: 'Рак', symbol: '♋', color: '#a855f7' },
    { name: 'Лев', symbol: '♌', color: '#f97316' },
    { name: 'Діва', symbol: '♍', color: '#22c55e' },
    { name: 'Терези', symbol: '♎', color: '#06b6d4' },
    { name: 'Скорпіон', symbol: '♏', color: '#dc2626' },
    { name: 'Стрілець', symbol: '♐', color: '#8b5cf6' },
    { name: 'Козеріг', symbol: '♑', color: '#64748b' },
    { name: 'Водолій', symbol: '♒', color: '#3b82f6' },
    { name: 'Риби', symbol: '♓', color: '#06b6d4' }
  ];

  // Planet symbols
  const planetSymbols = {
    'Асцендент': 'ASC',
    'Середина Неба (MC)': 'MC',
    'Сонце': '☉',
    'Місяць': '☽',
    'Меркурій': '☿',
    'Венера': '♀',
    'Марс': '♂',
    'Юпітер': '♃',
    'Сатурн': '♄',
    'Уран': '♅',
    'Нептун': '♆',
    'Плутон': '♇',
    'Хірон': '⚷',
    'Північний вузол': '☊',
    'Південний вузол': '☋',
    'Ліліт': '⚸'
  };

  // Convert longitude to angle with ASC at 270° (left side)
  // ASC is at 9 o'clock position, houses go counterclockwise
  const longitudeToAngle = (longitude) => {
    if (!chart.planets) return 0;
    const asc = chart.planets.find(p => p.name === 'Асцендент');
    if (!asc) return 0;
    
    // ASC на 270° (ліва сторона), будинки проти годинникової
    let angle = 270 + (longitude - asc.longitude);
    
    // Нормалізація до 0-360
    while (angle < 0) angle += 360;
    while (angle >= 360) angle -= 360;
    
    return angle;
  };

  // Calculate point on circle
  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY - radius * Math.sin(angleInRadians)
    };
  };

  // Draw zodiac wheel
  const renderZodiacWheel = () => {
    return zodiacSigns.map((sign, index) => {
      const startAngle = index * 30;
      const endAngle = (index + 1) * 30;
      const midAngle = startAngle + 15;

      const start1 = polarToCartesian(centerX, centerY, outerRadius, longitudeToAngle(startAngle));
      const end1 = polarToCartesian(centerX, centerY, outerRadius, longitudeToAngle(endAngle));
      const start2 = polarToCartesian(centerX, centerY, innerRadius, longitudeToAngle(startAngle));
      const end2 = polarToCartesian(centerX, centerY, innerRadius, longitudeToAngle(endAngle));

      const pathData = [
        `M ${start1.x} ${start1.y}`,
        `A ${outerRadius} ${outerRadius} 0 0 0 ${end1.x} ${end1.y}`,
        `L ${end2.x} ${end2.y}`,
        `A ${innerRadius} ${innerRadius} 0 0 1 ${start2.x} ${start2.y}`,
        'Z'
      ].join(' ');

      const textPos = polarToCartesian(centerX, centerY, (outerRadius + innerRadius) / 2, longitudeToAngle(midAngle));

      return (
        <g key={index}>
          <path
            d={pathData}
            fill="rgba(139, 92, 246, 0.05)"
            stroke="rgba(139, 92, 246, 0.3)"
            strokeWidth="1"
          />
          <text
            x={textPos.x}
            y={textPos.y}
            fontSize="24"
            fill={sign.color}
            textAnchor="middle"
            dominantBaseline="middle"
            fontWeight="600"
          >
            {sign.symbol}
          </text>
        </g>
      );
    });
  };

  // Draw houses
  const renderHouses = () => {
    if (!chart.houses) return null;

    return chart.houses.map((house, index) => {
      const angle = longitudeToAngle(house.cusp);
      const nextAngle = index < 11 
        ? longitudeToAngle(chart.houses[index + 1].cusp)
        : longitudeToAngle(chart.houses[0].cusp + 360);

      const start = polarToCartesian(centerX, centerY, houseRadius, angle);
      const end = polarToCartesian(centerX, centerY, 0, angle);

      // House number position
      let midAngle = angle + (nextAngle - angle) / 2;
      if (nextAngle < angle) midAngle = angle + (nextAngle + 360 - angle) / 2;
      
      const textPos = polarToCartesian(centerX, centerY, houseRadius - 30, midAngle);

      return (
        <g key={index}>
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke="rgba(139, 92, 246, 0.4)"
            strokeWidth="1.5"
            strokeDasharray="3,3"
          />
          <text
            x={textPos.x}
            y={textPos.y}
            fontSize="14"
            fill="rgba(196, 181, 253, 0.8)"
            textAnchor="middle"
            dominantBaseline="middle"
            fontWeight="500"
          >
            {house.number}
          </text>
        </g>
      );
    });
  };

  // Draw planets
  const renderPlanets = () => {
    if (!chart.planets) return null;

    // Group planets by proximity to avoid overlap
    const planets = chart.planets.filter(p => p.name !== 'Асцендент' && p.name !== 'Середина Неба (MC)');
    
    return planets.map((planet, index) => {
      const angle = longitudeToAngle(planet.longitude);
      const symbol = planetSymbols[planet.name] || planet.name.substring(0, 2);
      
      // Adjust radius slightly for overlapping planets
      let adjustedRadius = planetRadius;
      const tolerance = 5;
      
      for (let i = 0; i < index; i++) {
        const otherPlanet = planets[i];
        const angleDiff = Math.abs(planet.longitude - otherPlanet.longitude);
        if (angleDiff < tolerance || angleDiff > 360 - tolerance) {
          adjustedRadius -= 15;
        }
      }

      const pos = polarToCartesian(centerX, centerY, adjustedRadius, angle);
      const lineEnd = polarToCartesian(centerX, centerY, innerRadius + 5, angle);

      // Determine color based on planet
      let color = '#c4b5fd';
      if (planet.name.includes('Сонце')) color = '#fbbf24';
      if (planet.name.includes('Місяць')) color = '#e0e7ff';
      if (planet.name.includes('Венера')) color = '#f9a8d4';
      if (planet.name.includes('Марс')) color = '#f87171';
      if (planet.name.includes('Меркурій')) color = '#93c5fd';
      if (planet.name.includes('Юпітер')) color = '#fb923c';
      if (planet.name.includes('Сатурн')) color = '#a78bfa';

      return (
        <g key={index}>
          <line
            x1={lineEnd.x}
            y1={lineEnd.y}
            x2={pos.x}
            y2={pos.y}
            stroke="rgba(139, 92, 246, 0.3)"
            strokeWidth="1"
          />
          <circle
            cx={pos.x}
            cy={pos.y}
            r="18"
            fill="rgba(15, 15, 30, 0.9)"
            stroke={color}
            strokeWidth="2"
          />
          <text
            x={pos.x}
            y={pos.y}
            fontSize="16"
            fill={color}
            textAnchor="middle"
            dominantBaseline="middle"
            fontWeight="600"
          >
            {symbol}
          </text>
        </g>
      );
    });
  };

  // Draw ASC and MC markers
  const renderAngles = () => {
    if (!chart.planets) return null;

    const asc = chart.planets.find(p => p.name === 'Асцендент');
    const mc = chart.planets.find(p => p.name === 'Середина Неба (MC)');

    const angles = [];
    
    if (asc) {
      const angle = longitudeToAngle(asc.longitude);
      const pos = polarToCartesian(centerX, centerY, innerRadius - 25, angle);
      const lineStart = polarToCartesian(centerX, centerY, innerRadius + 5, angle);
      const lineEnd = polarToCartesian(centerX, centerY, 0, angle);

      angles.push(
        <g key="asc">
          <line
            x1={lineStart.x}
            y1={lineStart.y}
            x2={lineEnd.x}
            y2={lineEnd.y}
            stroke="#8b5cf6"
            strokeWidth="3"
          />
          <circle
            cx={pos.x}
            cy={pos.y}
            r="20"
            fill="rgba(139, 92, 246, 0.2)"
            stroke="#8b5cf6"
            strokeWidth="2"
          />
          <text
            x={pos.x}
            y={pos.y}
            fontSize="14"
            fill="#c4b5fd"
            textAnchor="middle"
            dominantBaseline="middle"
            fontWeight="700"
          >
            ASC
          </text>
        </g>
      );
    }

    if (mc) {
      const angle = longitudeToAngle(mc.longitude);
      const pos = polarToCartesian(centerX, centerY, innerRadius - 25, angle);
      const lineStart = polarToCartesian(centerX, centerY, innerRadius + 5, angle);
      const lineEnd = polarToCartesian(centerX, centerY, 0, angle);

      angles.push(
        <g key="mc">
          <line
            x1={lineStart.x}
            y1={lineStart.y}
            x2={lineEnd.x}
            y2={lineEnd.y}
            stroke="#8b5cf6"
            strokeWidth="3"
          />
          <circle
            cx={pos.x}
            cy={pos.y}
            r="20"
            fill="rgba(139, 92, 246, 0.2)"
            stroke="#8b5cf6"
            strokeWidth="2"
          />
          <text
            x={pos.x}
            y={pos.y}
            fontSize="14"
            fill="#c4b5fd"
            textAnchor="middle"
            dominantBaseline="middle"
            fontWeight="700"
          >
            MC
          </text>
        </g>
      );
    }

    return angles;
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
      <svg width={width} height={height} style={{ background: 'rgba(15, 15, 30, 0.4)', borderRadius: '50%' }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={outerRadius}
          fill="none"
          stroke="rgba(139, 92, 246, 0.5)"
          strokeWidth="2"
          filter="url(#glow)"
        />

        {/* Inner circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={innerRadius}
          fill="none"
          stroke="rgba(139, 92, 246, 0.5)"
          strokeWidth="2"
          filter="url(#glow)"
        />

        {/* House circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={houseRadius}
          fill="none"
          stroke="rgba(139, 92, 246, 0.3)"
          strokeWidth="1"
        />

        {/* Center circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={50}
          fill="rgba(139, 92, 246, 0.1)"
          stroke="rgba(139, 92, 246, 0.4)"
          strokeWidth="1"
        />

        {/* Zodiac wheel */}
        {renderZodiacWheel()}

        {/* Houses */}
        {renderHouses()}

        {/* ASC and MC */}
        {renderAngles()}

        {/* Planets */}
        {renderPlanets()}
      </svg>
    </div>
  );
};

export default NatalChartWheel;
