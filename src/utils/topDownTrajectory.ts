// Top-Down (Bird's-Eye View) Trajectory Drawing Engine for Petanque Visualizer
// Shows lateral wind deflection, aerial altitude scale, shadow projection, and landing rollout.

export interface TopDownRenderOptions {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  progress: number;
  windSpeed: number; // km/h
  windDirection: number; // degrees (0° = East/Tailwind, 90° = South/Crosswind downward, 180° = West/Headwind, 270° = North/Crosswind upward)
  activeTrajMode: string;
  selectedTerrain: string;
  isMobile: boolean;
  terrainColors: {
    groundColorTop: string;
    groundColorBottom: string;
    boundaryColor: string;
    rollMultiplier: number;
  };
  customPhysics?: {
    enabled: boolean;
    releaseAngle: number;
    initialVelocity: number;
    backspinRpm: number;
  };
  isPaused?: boolean;
}

export function drawTopDownTrajectory({
  ctx,
  w,
  h,
  progress,
  windSpeed,
  windDirection,
  activeTrajMode,
  selectedTerrain,
  isMobile,
  terrainColors,
  customPhysics,
  isPaused,
}: TopDownRenderOptions): void {
  // Clear full canvas
  ctx.clearRect(0, 0, w, h);

  // Field geometry (Top-Down Lane)
  const laneTop = h * 0.15;
  const laneBottom = h * 0.85;
  const laneHeight = laneBottom - laneTop;
  const centerY = h * 0.50;

  // 1. Terrain Ground Fill (Top-Down Surface)
  const courtGrad = ctx.createLinearGradient(0, laneTop, 0, laneBottom);
  courtGrad.addColorStop(0, terrainColors.groundColorTop);
  courtGrad.addColorStop(0.5, terrainColors.groundColorBottom);
  courtGrad.addColorStop(1, terrainColors.groundColorTop);
  ctx.fillStyle = courtGrad;
  ctx.fillRect(0, laneTop, w, laneHeight);

  // Outer surround (Dead ground outside court)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.fillRect(0, 0, w, laneTop);
  ctx.fillRect(0, laneBottom, w, h - laneBottom);

  // Lane Boundary Timber / String Lines (Ficelle)
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, laneTop);
  ctx.lineTo(w, laneTop);
  ctx.moveTo(0, laneBottom);
  ctx.lineTo(w, laneBottom);
  ctx.stroke();

  // Surface texture details
  if (selectedTerrain === 'gravel') {
    ctx.fillStyle = 'rgba(203, 213, 225, 0.45)';
    for (let i = 0; i < 50; i++) {
      const gx = (i * 0.02 + 0.02) * w;
      const gy = laneTop + ((i * 37) % Math.floor(laneHeight - 16)) + 8;
      ctx.fillRect(gx, gy, 3, 3);
    }
  } else if (selectedTerrain === 'sandy_ground') {
    ctx.fillStyle = 'rgba(254, 243, 199, 0.35)';
    for (let i = 0; i < 60; i++) {
      const gx = (i * 0.016 + 0.03) * w;
      const gy = laneTop + ((i * 47) % Math.floor(laneHeight - 12)) + 6;
      ctx.fillRect(gx, gy, 2, 2);
    }
  } else if (selectedTerrain === 'grass') {
    ctx.fillStyle = 'rgba(74, 222, 128, 0.35)';
    for (let i = 0; i < 40; i++) {
      const gx = (i * 0.024 + 0.02) * w;
      const gy = laneTop + ((i * 53) % Math.floor(laneHeight - 14)) + 7;
      ctx.fillRect(gx, gy, 5, 2);
    }
  }

  // 2. Center Reference Target Line (Ideal straight trajectory with 0 wind)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(w * 0.08, centerY);
  ctx.lineTo(w * 0.94, centerY);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.restore();

  // 3. Throwing Circle on Left (Ø 50cm FIPJP)
  const startX = w * 0.08;
  ctx.beginPath();
  ctx.arc(startX, centerY, isMobile ? 18 : 24, 0, Math.PI * 2);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2.5;
  ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
  ctx.fill();
  ctx.stroke();

  ctx.font = isMobile ? '8.5px "Plus Jakarta Sans", Prompt, sans-serif' : '10px "Plus Jakarta Sans", Prompt, sans-serif';
  ctx.fillStyle = '#f59e0b';
  ctx.textAlign = 'center';
  ctx.fillText('วงกลมโยน', startX, centerY - (isMobile ? 24 : 30));

  // 4. Target Jack (Cochonnet) on Right
  const jackX = w * 0.88;
  const jackY = centerY;

  // Concentric target radii around jack (30cm & 50cm zones)
  const radius30cm = isMobile ? 22 : 30;
  const radius50cm = isMobile ? 38 : 50;

  // 30 cm inner zone (Point Close / Elite Zone)
  ctx.save();
  ctx.beginPath();
  ctx.arc(jackX, jackY, radius30cm, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.5)';
  ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
  ctx.setLineDash([3, 3]);
  ctx.fill();
  ctx.stroke();

  // 50 cm outer zone
  ctx.beginPath();
  ctx.arc(jackX, jackY, radius50cm, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
  ctx.stroke();
  ctx.restore();

  // Cochonnet sphere
  ctx.beginPath();
  ctx.arc(jackX, jackY, isMobile ? 5 : 6.5, 0, Math.PI * 2);
  ctx.fillStyle = '#fbbf24';
  ctx.shadowColor = 'rgba(251, 191, 36, 0.8)';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = isMobile ? '8.5px "Plus Jakarta Sans", Prompt, sans-serif' : '9.5px "Plus Jakarta Sans", Prompt, sans-serif';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('แก่น (Jack)', jackX, jackY + (isMobile ? 16 : 20));

  // 5. Physics & Aerodynamic Lateral Drift Calculation
  const windAngleRad = (windDirection * Math.PI) / 180;
  const windCos = Math.cos(windAngleRad); // Forward (+ tailwind) / Backward (- headwind)
  const windSin = Math.sin(windAngleRad); // Lateral (+ pushes downward / - pushes upward)

  const windSensitivity =
    activeTrajMode === 'highlob' ? 1.75 :
    activeTrajMode === 'halflob' ? 1.05 :
    activeTrajMode === 'carreau' ? 0.60 :
    activeTrajMode === 'screwback' ? 0.50 : 0.35;

  // Base preset distances
  let baseLandRatioX = 0.58;
  let baseFinalRatioX = 0.84;
  let apexHeightFactor = 1.0;

  if (activeTrajMode === 'highlob') {
    baseLandRatioX = 0.72;
    baseFinalRatioX = 0.82;
    apexHeightFactor = 1.6;
  } else if (activeTrajMode === 'halflob') {
    baseLandRatioX = 0.58;
    baseFinalRatioX = 0.85;
    apexHeightFactor = 1.0;
  } else if (activeTrajMode === 'rolling') {
    baseLandRatioX = 0.45;
    baseFinalRatioX = 0.88;
    apexHeightFactor = 0.4;
  } else if (activeTrajMode === 'carreau') {
    baseLandRatioX = 0.85;
    baseFinalRatioX = 0.86;
    apexHeightFactor = 0.7;
  } else if (activeTrajMode === 'screwback') {
    baseLandRatioX = 0.85;
    baseFinalRatioX = 0.77;
    apexHeightFactor = 0.65;
  }

  // Custom Physics Override if active
  if (customPhysics && customPhysics.enabled) {
    const angleRad = (customPhysics.releaseAngle * Math.PI) / 180;
    const v0 = customPhysics.initialVelocity;
    // Normalized flight range
    const g = 9.8;
    const flightDist = (v0 * v0 * Math.sin(2 * angleRad)) / g;
    baseLandRatioX = Math.min(0.90, Math.max(0.30, 0.08 + (flightDist / 12.0) * 0.75));
    apexHeightFactor = Math.sin(angleRad) * (v0 / 8.5);
    // Backspin dampens roll
    const spinFactor = Math.max(0.1, 1 - customPhysics.backspinRpm / 500);
    baseFinalRatioX = Math.min(0.95, baseLandRatioX + 0.15 * spinFactor * terrainColors.rollMultiplier);
  }

  // Airborne Wind Drifts
  const maxDriftXPx = w * 0.15;
  const windDriftX = (windSpeed / 50) * windCos * windSensitivity * maxDriftXPx;

  const maxDriftYPx = laneHeight * 0.36;
  const windDriftY = (windSpeed / 50) * windSin * windSensitivity * maxDriftYPx;

  const landX = Math.max(startX + 28, Math.min(w * 0.94, w * baseLandRatioX + windDriftX));
  const landY = centerY + windDriftY;

  // Ground Rollout
  const isScrewback = activeTrajMode === 'screwback';
  const rollDeltaX = (w * baseFinalRatioX - w * baseLandRatioX) * terrainColors.rollMultiplier;
  const finalX = isScrewback ? landX - Math.abs(rollDeltaX * 0.5) : Math.min(w * 0.95, landX + rollDeltaX);
  // Roll slightly drifts along slope/wind
  const finalY = landY + windDriftY * 0.15;

  // 6. Draw Opponent Boule in Carreau / Screwback mode
  const isTargetHitMode = activeTrajMode === 'carreau' || activeTrajMode === 'screwback';
  if (isTargetHitMode) {
    const isTargetHit = Math.abs(landX - jackX) < 28 && Math.abs(landY - jackY) < 22;
    const oppBlastX = jackX + (progress > 0.7 && isTargetHit ? (progress - 0.7) * 220 : 0);
    const oppBlastY = jackY + (progress > 0.7 && isTargetHit ? (progress - 0.7) * (windSin * 90) : 0);
    const oppAlpha = progress > 0.7 && isTargetHit ? Math.max(0.08, 1 - (progress - 0.7) * 2.2) : 1;

    ctx.save();
    ctx.globalAlpha = oppAlpha;
    ctx.beginPath();
    ctx.arc(oppBlastX, oppBlastY, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#64748b';
    ctx.fill();
    ctx.strokeStyle = isTargetHit ? '#ef4444' : '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = isMobile ? '8px "Plus Jakarta Sans", Prompt, sans-serif' : '9px "Plus Jakarta Sans", Prompt, sans-serif';
    ctx.fillStyle = isTargetHit ? '#ef4444' : '#94a3b8';
    ctx.fillText(isTargetHit ? 'เป้าชน Carreau' : 'ลูกคู่แข่ง', oppBlastX, oppBlastY - 14);
    ctx.restore();
  }

  // 7. Full Projected Trajectory Trail Line (Top-Down with curve)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(startX, centerY);
  // Quadratic curve representing wind bending the ball sideways
  const ctrlX = (startX + landX) * 0.5;
  const ctrlY = centerY + windDriftY * 0.6;
  ctx.quadraticCurveTo(ctrlX, ctrlY, landX, landY);
  ctx.lineTo(finalX, finalY);

  ctx.strokeStyle = '#e05326';
  ctx.lineWidth = isMobile ? 2 : 2.5;
  ctx.setLineDash([5, 4]);
  ctx.stroke();
  ctx.restore();

  // Landing impact circle marker
  ctx.beginPath();
  ctx.arc(landX, landY, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#38bdf8';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 8. Ball & Airborne Dynamic Animation
  let ballX = startX;
  let ballY = centerY;
  let shadowX = startX;
  let shadowY = centerY;
  let altitudeNormalized = 0; // 0 at ground, 1 at peak

  if (progress <= 0.7) {
    // Phase 1: Airborne Flight
    const airT = progress / 0.7;
    // Ground projection along the curved wind trajectory
    const tInv = 1 - airT;
    shadowX = tInv * tInv * startX + 2 * tInv * airT * ctrlX + airT * airT * landX;
    shadowY = tInv * tInv * centerY + 2 * tInv * airT * ctrlY + airT * airT * landY;

    altitudeNormalized = Math.sin(airT * Math.PI);
    const altitudeElevationPx = altitudeNormalized * (laneHeight * 0.38 * apexHeightFactor);

    ballX = shadowX;
    ballY = shadowY - altitudeElevationPx;
  } else {
    // Phase 2: Ground Rollout
    const rollT = (progress - 0.7) / 0.3;
    const easedRoll = 1 - Math.pow(1 - rollT, 2); // Decelerating curve
    ballX = landX + (finalX - landX) * easedRoll;
    ballY = landY + (finalY - landY) * easedRoll;
    shadowX = ballX;
    shadowY = ballY;
    altitudeNormalized = 0;
  }

  // Draw Ground Shadow (Under ball)
  ctx.save();
  const shadowRadius = (isMobile ? 9 : 11) * (1 - altitudeNormalized * 0.35);
  ctx.beginPath();
  ctx.ellipse(shadowX, shadowY, shadowRadius, shadowRadius * 0.55, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0.15, 0.65 - altitudeNormalized * 0.4)})`;
  ctx.fill();
  ctx.restore();

  // Draw Boule Sphere (Scales up with altitude to simulate 3D Bird's-Eye View)
  ctx.save();
  const ballRadius = (isMobile ? 9 : 11) * (1 + altitudeNormalized * 0.55);

  const bouleGrad = ctx.createRadialGradient(
    ballX - ballRadius * 0.3,
    ballY - ballRadius * 0.3,
    ballRadius * 0.15,
    ballX,
    ballY,
    ballRadius
  );
  bouleGrad.addColorStop(0, '#ffffff');
  bouleGrad.addColorStop(0.35, '#cbd5e1');
  bouleGrad.addColorStop(1, '#334155');

  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = bouleGrad;
  ctx.fill();
  ctx.strokeStyle = '#e05326';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Striation lines on ball
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius * 0.65, 0, Math.PI);
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.restore();

  // Step-through pause reticle and inspection HUD in Top-Down view
  if (isPaused) {
    ctx.save();
    // Glowing target ring
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius + 6, 0, Math.PI * 2);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([3, 3]);
    ctx.stroke();

    // Floating telemetry tag
    const distM = (((ballX - startX) / (w * 0.78)) * 8.0).toFixed(1);
    const tagText = `📍 ${distM}m (Frame ${(progress * 100).toFixed(0)}%)`;
    ctx.font = isMobile ? 'bold 8.5px "Plus Jakarta Sans", Prompt, sans-serif' : 'bold 9.5px "Plus Jakarta Sans", Prompt, sans-serif';
    const tagW = ctx.measureText(tagText).width + 12;
    const tagH = isMobile ? 18 : 20;
    const tagX = Math.max(6, Math.min(w - tagW - 6, ballX - tagW / 2));
    const tagY = Math.max(laneTop + 4, ballY - ballRadius - 16);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(tagX, tagY, tagW, tagH, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText(tagText, tagX + tagW / 2, tagY + (isMobile ? 12 : 13.5));
    ctx.restore();
  }

  // 9. Lateral Wind Deviation Measurement HUD & Ruler
  const lateralDeviationCm = Math.round(Math.abs(windDriftY) * 1.8);
  const lateralDirectionLabel = windSin > 0.05 ? 'เบี่ยงขวา ➡️' : windSin < -0.05 ? 'เบี่ยงซ้าย ⬅️' : 'ตรงศูนย์ (No Drift)';

  ctx.save();
  // Draw lateral drift bracket on right of court
  if (Math.abs(windDriftY) > 5) {
    ctx.beginPath();
    ctx.moveTo(landX, centerY);
    ctx.lineTo(landX, landY);
    ctx.strokeStyle = windSin > 0 ? '#38bdf8' : '#f43f5e';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([2, 2]);
    ctx.stroke();

    // Measurement text badge
    ctx.font = isMobile ? 'bold 8px "Plus Jakarta Sans", Prompt, sans-serif' : 'bold 9.5px "Plus Jakarta Sans", Prompt, sans-serif';
    ctx.fillStyle = windSin > 0 ? '#38bdf8' : '#f43f5e';
    ctx.textAlign = 'left';
    ctx.fillText(`Δ ลมเบี่ยง: ${lateralDeviationCm} cm`, landX + 8, (centerY + landY) / 2);
  }
  ctx.restore();

  // 10. Top-Right Bird's-Eye Telemetry HUD Card
  const hudW = isMobile ? 130 : 165;
  const hudH = isMobile ? 54 : 64;
  const hudX = w - hudW - (isMobile ? 8 : 14);
  const hudY = isMobile ? 8 : 14;

  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(hudX, hudY, hudW, hudH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.font = isMobile ? 'bold 8.5px "Plus Jakarta Sans", Prompt, sans-serif' : 'bold 10px "Plus Jakarta Sans", Prompt, sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'left';
  ctx.fillText('🦅 TOP-DOWN VIEW (มุมมองบน)', hudX + 8, hudY + 16);

  ctx.font = isMobile ? '8px "Plus Jakarta Sans", Prompt, sans-serif' : '9px "Plus Jakarta Sans", Prompt, sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(`ลมขวาง: ${Math.abs(windSpeed * windSin).toFixed(1)} km/h`, hudX + 8, hudY + 30);
  ctx.fillText(`การเบี่ยงเบน: ${lateralDeviationCm} cm (${lateralDirectionLabel})`, hudX + 8, hudY + 44);
  if (!isMobile) {
    ctx.fillText(`สนาม: กว้าง 4.0 ม. (FIPJP Standard)`, hudX + 8, hudY + 56);
  }

  ctx.restore();
}
