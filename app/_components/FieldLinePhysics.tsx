import React, { useEffect, useRef } from "react";

const FieldLinePhysics: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const charges = [
      { x: 200, y: 200, charge: 1 }, // Positive charge
      { x: 400, y: 300, charge: -1 }, // Negative charge
    ];

    const drawFieldLine = (
      startX: number,
      startY: number,
      chargeSign: number
    ) => {
      const step = 2;
      const maxSteps = 500;
      let x = startX;
      let y = startY;

      ctx.beginPath();
      ctx.moveTo(x, y);

      for (let i = 0; i < maxSteps; i++) {
        let fx = 0;
        let fy = 0;

        // Calculate field components from each charge
        charges.forEach((charge) => {
          const dx = x - charge.x;
          const dy = y - charge.y;
          const distanceSquared = dx * dx + dy * dy;
          const distance = Math.sqrt(distanceSquared);

          if (distance < 5) return; // Avoid singularities

          const force = charge.charge / distanceSquared;
          fx += force * (dx / distance);
          fy += force * (dy / distance);
        });

        // Normalize and step in the direction of the field
        const magnitude = Math.sqrt(fx * fx + fy * fy);
        if (magnitude === 0) break;

        fx /= magnitude;
        fy /= magnitude;

        x += chargeSign * fx * step;
        y += chargeSign * fy * step;

        ctx.lineTo(x, y);

        // Stop if it exits the canvas boundaries
        if (x < 0 || x > width || y < 0 || y > height) break;
      }

      ctx.strokeStyle = chargeSign > 0 ? "red" : "blue";
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const drawFieldLines = () => {
      ctx.clearRect(0, 0, width, height);

      charges.forEach((charge) => {
        const numLines = 12;
        const radius = 20;
        for (let i = 0; i < numLines; i++) {
          const angle = (i / numLines) * 2 * Math.PI;
          const startX = charge.x + radius * Math.cos(angle);
          const startY = charge.y + radius * Math.sin(angle);
          drawFieldLine(startX, startY, charge.charge > 0 ? 1 : -1);
        }
      });

      // Draw charges
      charges.forEach((charge) => {
        ctx.beginPath();
        ctx.arc(charge.x, charge.y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = charge.charge > 0 ? "red" : "blue";
        ctx.fill();
      });
    };

    drawFieldLines();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={400}
      style={{
        border: "1px solid black",
        display: "block",
        margin: "20px auto",
      }}
    />
  );
};

export default FieldLinePhysics;
