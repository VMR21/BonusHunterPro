import { useEffect, useRef } from "react";
import type { Bonus } from "@shared/schema";

interface ProviderChartProps {
  bonuses: Bonus[];
}

export function ProviderChart({ bonuses }: ProviderChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || bonuses.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calculate provider distribution
    const providerCounts = bonuses.reduce((acc, bonus) => {
      acc[bonus.provider] = (acc[bonus.provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const providers = Object.entries(providerCounts).map(([name, count]) => ({
      name,
      count,
      percentage: (count / bonuses.length) * 100,
    }));

    // Colors for providers
    const colors = [
      '#6366F1', // primary
      '#8B5CF6', // secondary
      '#06B6D4', // accent
      '#10B981', // green
      '#F59E0B', // yellow
      '#EF4444', // red
    ];

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 100;
    const innerRadius = 60;

    let currentAngle = 0;

    providers.forEach((provider, index) => {
      const sliceAngle = (provider.percentage / 100) * 2 * Math.PI;
      const color = colors[index % colors.length];

      // Draw outer arc
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      currentAngle += sliceAngle;
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#1E1B4B';
    ctx.fill();

    // Draw center text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Providers', centerX, centerY);

  }, [bonuses]);

  if (bonuses.length === 0) {
    return (
      <div className="flex justify-center items-center h-80">
        <p className="text-gray-400">No bonuses to display</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={300} 
        className="max-w-full"
        data-testid="canvas-provider-chart"
      />
    </div>
  );
}
