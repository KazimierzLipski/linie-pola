"use client";
import React, { MouseEvent, useEffect, useRef, useState } from "react";

class Vector {
  ctx: CanvasRenderingContext2D;
  i: number;
  j: number;

  constructor(ctx: CanvasRenderingContext2D, i: number, j: number) {
    this.ctx = ctx;
    this.i = i;
    this.j = j;
  }

  draw = (originx: number, originy: number, vectorLen: number) => {
    /* if i and j are both 0 then the vector is just a dot*/

    if (this.i === 0 && this.j === 0) {
      const ctx = this.ctx;
      ctx.resetTransform();
      ctx.beginPath();
      ctx.arc(originx, originy, vectorLen * 0.15, 0, 2 * Math.PI);
      ctx.strokeStyle = "blue";
      ctx.fillStyle = "blue";
      ctx.fill();
      ctx.stroke();
    } else {
      const angle = this.calcAngle(this.i, this.j);
      const arrowLen = vectorLen * 0.2;
      const ctx = this.ctx;

      ctx.resetTransform();
      ctx.beginPath();
      ctx.translate(originx - originy, originy);
      if (originx < originy) ctx.translate(800, -20);
      if (angle !== null) ctx.rotate(-angle);

      ctx.lineWidth = 2;
      ctx.moveTo(0, 0);
      ctx.lineTo(vectorLen, 0);
      ctx.lineTo(vectorLen - arrowLen, arrowLen);
      ctx.moveTo(vectorLen, 0);
      ctx.lineTo(vectorLen - arrowLen, -arrowLen);
      ctx.strokeStyle = "blue";
      ctx.stroke();
    }
  };

  calcAngle = (x: number, y: number) => {
    if (x === 0 && y === 0) {
      return null;
    } else if (x > 0 && y > 0) {
      return Math.atan(y / x);
    } else if (x < 0 && y > 0) {
      return Math.PI - Math.atan(y / -x);
    } else if (x < 0 && y < 0) {
      return Math.PI + Math.atan(y / x);
    } else if (x > 0 && y < 0) {
      return 2 * Math.PI - Math.atan(-y / x);
    } else if (x === 0) {
      return y > 0 ? Math.PI / 2 : 1.5 * Math.PI;
    }
    return x > 0 ? 0 : Math.PI;
  };
}

const FieldLinePhysics: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [charges, setCharges] = useState<
    { x: number; y: number; charge: number; id: number }[] | undefined
  >([
    // { x: 200, y: 200, charge: 1 }, // Positive charge
    // { x: 400, y: 300, charge: -1 }, // Negative charge
  ]);
  const [objects, setObjects] = useState<
    | {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        chargeDensity: number;
        id: number;
      }[]
    | undefined
  >([
    // { x1: 200, y1: 200, x2: 200, y2: 400, chargeDensity: 5, id: 1 }, // Positive charge
    // { x1: 300, y1: 200, x2: 300, y2: 400, chargeDensity: -5, id: 2 }, // Negative
  ]);
  const [draggingCharge, setDraggingCharge] = useState<
    | {
        id: number;
        type: "charge" | "object";
      }
    | undefined
  >(undefined);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    selected:
      | {
          id: number;
          type: "charge" | "object";
        }
      | undefined;
  }>({ visible: false, x: 0, y: 0, selected: undefined });

  // const [vectorArrayState, setVectorArrayState] = useState<Vector[]>([]);
  const [clickedNode, setClickedNode] = useState<
    | {
        id: number;
        type: "charge" | "object";
      }
    | undefined
  >(undefined);

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

    const drawFieldLines = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw charges
      charges?.forEach((charge) => {
        ctx.beginPath();
        ctx.arc(charge.x, charge.y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = charge.charge > 0 ? "red" : "blue";
        ctx.fill();
      });
      objects?.forEach((object) => {
        ctx.beginPath();
        ctx.moveTo(object.x1, object.y1);
        ctx.lineTo(object.x2, object.y2);
        ctx.lineWidth = 10; // Set the line width to be as thick as a charge
        ctx.strokeStyle = object.chargeDensity > 0 ? "red" : "blue";
        ctx.lineCap = "round"; // Make the ends of the line rounded
        ctx.stroke();
      });
    };

    drawFieldLines();

    const vectorArray: Vector[] = [];
    const gridSize = 20;
    const vectorLen = 20;

    for (let y = 0; y < height; y += gridSize) {
      for (let x = 0; x < width; x += gridSize) {
        let Ex = 0;
        let Ey = 0;

        charges?.forEach((charge) => {
          const dx = x - charge.x;
          const dy = y - charge.y;
          const rSquared = dx * dx + dy * dy;
          const r = Math.sqrt(rSquared);
          const E = (charge.charge * 1000) / rSquared;

          Ex += (E * dx) / r;
          Ey += (E * -dy) / r;
        });
        objects?.forEach((object) => {
          const length = Math.hypot(
            object.x2 - object.x1,
            object.y2 - object.y1
          );
          const numSegments = Math.ceil(length / gridSize) * 10;
          for (let i = 0; i <= numSegments; i++) {
            const t = i / numSegments;
            const segmentX = object.x1 + t * (object.x2 - object.x1);
            const segmentY = object.y1 + t * (object.y2 - object.y1);
            const dx = x - segmentX;
            const dy = y - segmentY;

            const rSquared = dx * dx + dy * dy;
            const r = Math.sqrt(rSquared);
            const E = (object.chargeDensity * 1000) / numSegments / rSquared;

            Ex += (E * dx) / r;
            Ey += (E * -dy) / r;
          }
        });

        vectorArray.push(new Vector(ctx, Ex, Ey));
      }
    }

    // setVectorArrayState(vectorArray);

    vectorArray.forEach((vector, index) => {
      const y = Math.floor(index / Math.floor(width / gridSize)) * gridSize;
      const x = (index % Math.floor(width / gridSize)) * gridSize;
      const vectorMagnitude =
        Math.sqrt(vector.i * vector.i + vector.j * vector.j) * 100;
      const scaledVectorLen = Math.min(
        vectorLen * (vectorMagnitude / 10),
        vectorLen * 1
      ); // Scale the vector length based on the magnitude with a ceiling
      vector.draw(x, y, scaledVectorLen);
    });

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [charges, objects]);

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const objectIndex = objects?.findIndex((object) => {
      const length = Math.hypot(object.x2 - object.x1, object.y2 - object.y1);
      const gridSize = 20;
      const numSegments = Math.ceil(length / gridSize) * 10;
      for (let i = 0; i <= numSegments; i++) {
        const t = i / numSegments;
        const segmentX = object.x1 + t * (object.x2 - object.x1);
        const segmentY = object.y1 + t * (object.y2 - object.y1);
        const dx = x - segmentX;
        const dy = y - segmentY;

        const rSquared = dx * dx + dy * dy;
        const r = Math.sqrt(rSquared);
        if (r < 10) return true;
      }
      return false;
    });

    const chargeIndex = charges?.findIndex(
      (charge) => Math.hypot(charge.x - x, charge.y - y) < 10
    );

    if (objectIndex !== -1 && objectIndex !== undefined) {
      console.log("objectIndex", objectIndex);
      setDraggingCharge({ id: objectIndex, type: "object" });
      setClickedNode(
        objects ? { id: objects[objectIndex].id, type: "object" } : undefined
      );
    } else if (chargeIndex !== -1 && chargeIndex !== undefined) {
      setDraggingCharge({ id: chargeIndex, type: "charge" });
      setClickedNode(
        charges ? { id: charges[chargeIndex].id, type: "charge" } : undefined
      );
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggingCharge === undefined) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (draggingCharge.type === "charge") {
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      setCharges((prevCharges) => {
        if (prevCharges == undefined) return prevCharges;
        return prevCharges.map((charge, index) =>
          index === draggingCharge.id ? { ...charge, x, y } : charge
        );
      });
    } else if (draggingCharge.type === "object") {
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      setObjects((prevObjects) => {
        if (prevObjects == undefined) return prevObjects;
        return prevObjects.map((object, index) => {
          if (index === draggingCharge.id) {
            const dx = x - object.x1;
            const dy = y - object.y1;
            return {
              ...object,
              x1: x,
              y1: y,
              x2: object.x2 + dx,
              y2: object.y2 + dy,
            };
          }
          return object;
        });
      });
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    e.preventDefault();
    setDraggingCharge(undefined);
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const objectIndex = objects?.findIndex((object) => {
      const length = Math.hypot(object.x2 - object.x1, object.y2 - object.y1);
      const gridSize = 20;
      const numSegments = Math.ceil(length / gridSize) * 10;
      for (let i = 0; i <= numSegments; i++) {
        const t = i / numSegments;
        const segmentX = object.x1 + t * (object.x2 - object.x1);
        const segmentY = object.y1 + t * (object.y2 - object.y1);
        const dx = x - segmentX;
        const dy = y - segmentY;

        const rSquared = dx * dx + dy * dy;
        const r = Math.sqrt(rSquared);
        if (r < 10) return true;
      }
      return false;
    });

    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      selected: { id: objectIndex ?? 0, type: "object" },
    });

    const chargeIndex = charges?.findIndex(
      (charge) => Math.hypot(charge.x - x, charge.y - y) < 10
    );

    if (chargeIndex !== -1) {
      setContextMenu({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        selected: { id: chargeIndex ?? 0, type: "charge" },
      });
    }
  };

  const handleDeleteCharge = () => {
    if (contextMenu.selected !== undefined) {
      console.log(contextMenu.selected);
      if (contextMenu.selected.type === "charge") {
        setCharges((prevCharges) => {
          if (prevCharges == undefined) return prevCharges;
          return prevCharges.filter(
            (_, index) => index !== contextMenu.selected?.id
          );
        });
        setContextMenu({ visible: false, x: 0, y: 0, selected: undefined });
      } else if (contextMenu.selected.type === "object") {
        setObjects((prevObjects) => {
          if (prevObjects == undefined) return prevObjects;
          return prevObjects.filter(
            (_, index) => index !== contextMenu.selected?.id
          );
        });
        setContextMenu({ visible: false, x: 0, y: 0, selected: undefined });
      }
      setClickedNode(undefined);
    }
  };

  const handleAddCharge = (charge: 1 | -1) => {
    setContextMenu((p) => {
      setCharges((prevCharges) => {
        console.log(prevCharges);
        if (prevCharges == undefined || prevCharges.length === 0)
          return [
            {
              x: p.x,
              y: p.y,
              charge: charge,
              id: 0,
            },
          ];
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
            id: prevCharges[prevCharges.length - 1].id + 1,
          },
        ];
      });

      return { visible: false, x: 0, y: 0, selected: undefined };
    });
  };

  const handleAddObject = (charge: 1 | -1) => {
    setContextMenu((p) => {
      setObjects((prevObjects) => {
        console.log(prevObjects);
        if (prevObjects == undefined || prevObjects.length === 0)
          return [
            {
              x1: p.x,
              y1: p.y,
              x2: p.x,
              y2: p.y + 100,
              chargeDensity: charge,
              id: 0,
            },
          ];
        if (
          prevObjects[prevObjects.length - 1].x1 === p.x &&
          prevObjects[prevObjects.length - 1].y1 === p.y
        ) {
          return prevObjects;
        }
        return [
          ...prevObjects,
          {
            x1: p.x,
            y1: p.y,
            x2: p.x,
            y2: p.y + 100,
            chargeDensity: charge,
            id: prevObjects[prevObjects.length - 1].id + 1,
          },
        ];
      });

      return { visible: false, x: 0, y: 0, selected: undefined };
    });
  };

  return (
    <div className="flex flex-row">
      <div className="ml-0" style={{ width: "800px", height: "800px" }}>
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
            <button onClick={() => handleAddCharge(1)}>
              Add Positive Charge
            </button>
            <button onClick={() => handleAddCharge(-1)}>
              Add Negative Charge
            </button>
            <button onClick={() => handleAddObject(1)}>
              Add Positive Object
            </button>
            <button onClick={() => handleAddObject(-1)}>
              Add Negative Object
            </button>
            <button onClick={handleDeleteCharge}>Delete Node</button>
          </div>
        )}
      </div>
      {clickedNode !== undefined ? (
        <div className="text-xl border flex flex-col gap-2">
          <h1>
            Node {clickedNode?.id} {clickedNode?.type}
          </h1>
          {clickedNode?.type === "charge" ? (
            <>
              <label>
                Charge:
                <input
                  type="number"
                  className="border px-1 mx-1 border-black"
                  value={
                    charges?.find((charge) => charge.id === clickedNode.id)
                      ?.charge
                  }
                  onChange={(e) => {
                    const newCharge = parseFloat(e.target.value) || 0;
                    setCharges((prevCharges) =>
                      prevCharges?.map((charge) =>
                        charge.id === clickedNode.id
                          ? { ...charge, charge: newCharge }
                          : charge
                      )
                    );
                  }}
                />
              </label>
              <label>
                Position X:
                <input
                  type="number"
                  className="border px-1 mx-1 border-black"
                  value={
                    charges?.find((charge) => charge.id === clickedNode.id)?.x
                  }
                  onChange={(e) => {
                    const newX = parseFloat(e.target.value) || 0;
                    setCharges((prevCharges) =>
                      prevCharges?.map((charge) =>
                        charge.id === clickedNode.id
                          ? { ...charge, x: newX }
                          : charge
                      )
                    );
                  }}
                />
              </label>
              <label>
                Position Y:
                <input
                  type="number"
                  className="border px-1 mx-1 border-black"
                  value={
                    charges?.find((charge) => charge.id === clickedNode.id)?.y
                  }
                  onChange={(e) => {
                    const newY = parseFloat(e.target.value) || 0;
                    setCharges((prevCharges) =>
                      prevCharges?.map((charge) =>
                        charge.id === clickedNode.id
                          ? { ...charge, y: newY }
                          : charge
                      )
                    );
                  }}
                />
              </label>
            </>
          ) : (
            <>
              <label>
                Position X1:
                <input
                  type="number"
                  className="border px-1 mx-1 border-black"
                  value={
                    objects?.find((object) => object.id === clickedNode?.id)?.x1
                  }
                  onChange={(e) => {
                    const newX1 = parseFloat(e.target.value) || 0;
                    setObjects((prevObjects) =>
                      prevObjects?.map((object) =>
                        object.id === clickedNode?.id
                          ? { ...object, x1: newX1 }
                          : object
                      )
                    );
                  }}
                />
              </label>
              <label>
                Position Y1:
                <input
                  type="number"
                  className="border px-1 mx-1 border-black"
                  value={
                    objects?.find((object) => object.id === clickedNode?.id)?.y1
                  }
                  onChange={(e) => {
                    const newY1 = parseFloat(e.target.value) || 0;
                    setObjects((prevObjects) =>
                      prevObjects?.map((object) =>
                        object.id === clickedNode?.id
                          ? { ...object, y1: newY1 }
                          : object
                      )
                    );
                  }}
                />
              </label>
              <label>
                Position X2:
                <input
                  type="number"
                  className="border px-1 mx-1 border-black"
                  value={
                    objects?.find((object) => object.id === clickedNode?.id)?.x2
                  }
                  onChange={(e) => {
                    const newX2 = parseFloat(e.target.value) || 0;
                    setObjects((prevObjects) =>
                      prevObjects?.map((object) =>
                        object.id === clickedNode?.id
                          ? { ...object, x2: newX2 }
                          : object
                      )
                    );
                  }}
                />
              </label>
              <label>
                Position Y2:
                <input
                  type="number"
                  className="border px-1 mx-1 border-black"
                  value={
                    objects?.find((object) => object.id === clickedNode?.id)?.y2
                  }
                  onChange={(e) => {
                    const newY2 = parseFloat(e.target.value) || 0;
                    setObjects((prevObjects) =>
                      prevObjects?.map((object) =>
                        object.id === clickedNode?.id
                          ? { ...object, y2: newY2 }
                          : object
                      )
                    );
                  }}
                />
              </label>
              <label>
                Charge Density:
                <input
                  type="number"
                  className="border px-1 mx-1 border-black"
                  value={
                    objects?.find((object) => object.id === clickedNode?.id)
                      ?.chargeDensity
                  }
                  onChange={(e) => {
                    const newChargeDensity = parseFloat(e.target.value) || 0;
                    setObjects((prevObjects) =>
                      prevObjects?.map((object) =>
                        object.id === clickedNode?.id
                          ? { ...object, chargeDensity: newChargeDensity }
                          : object
                      )
                    );
                  }}
                />
              </label>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default FieldLinePhysics;
