"use client";
import React, { MouseEvent, useEffect, useRef, useState } from "react";

const FieldLinePhysics: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [charges, setCharges] = useState([
    { x: 200, y: 200, charge: 1 }, // Positive charge
    { x: 400, y: 300, charge: -1 }, // Negative charge
  ]);
  const [draggingChargeIndex, setDraggingChargeIndex] = useState<number | null>(
    null
  );
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    chargeIndex: number | null;
  }>({ visible: false, x: 0, y: 0, chargeIndex: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const width = canvas.width;
    const height = canvas.height;

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

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [charges]);

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const chargeIndex = charges.findIndex(
      (charge) => Math.hypot(charge.x - x, charge.y - y) < 10
    );

    if (chargeIndex !== -1) {
      setDraggingChargeIndex(chargeIndex);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggingChargeIndex === null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setCharges((prevCharges) =>
      prevCharges.map((charge, index) =>
        index === draggingChargeIndex ? { ...charge, x, y } : charge
      )
    );
  };

  const handleMouseUp = (e: MouseEvent) => {
    e.preventDefault();
    setDraggingChargeIndex(null);
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const chargeIndex = charges.findIndex(
      (charge) => Math.hypot(charge.x - x, charge.y - y) < 10
    );

    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      chargeIndex,
    });
  };

  const handleDeleteCharge = () => {
    if (contextMenu.chargeIndex !== null) {
      setCharges((prevCharges) =>
        prevCharges.filter((_, index) => index !== contextMenu.chargeIndex)
      );
      setContextMenu({ visible: false, x: 0, y: 0, chargeIndex: null });
    }
  };

  const handleAddCharge = (charge: 1 | -1) => {
    setContextMenu((p) => {
      setCharges((prevCharges) => {
        console.log(prevCharges);
        if (
          prevCharges[prevCharges.length - 1].x === p.x &&
          prevCharges[prevCharges.length - 1].y === p.y
        ) {
          return prevCharges;
        }
        return [
          ...prevCharges,
          {
            x: p.x,
            y: p.y,
            charge: charge,
          },
        ];
      });

      return { visible: false, x: 0, y: 0, chargeIndex: null };
    });
  };

  return (
    <div className="ml-0 mr-auto" style={{ width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        style={{
          border: "1px solid black",
          display: "block",
          width: "100%",
          height: 800,
        }}
        className="ml-0 mr-auto"
        // onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
      />
      {contextMenu.visible && (
        <div
          style={{
            position: "absolute",
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: "white",
            border: "1px solid black",
            zIndex: 1000,
          }}
          className="flex flex-col gap-1"
        >
          <button onClick={() => handleAddCharge(1)}>Add Positive Node</button>
          <button onClick={() => handleAddCharge(-1)}>Add Negative Node</button>
          <button onClick={handleDeleteCharge}>Delete Node</button>
        </div>
      )}
    </div>
  );
};

export default FieldLinePhysics;