import React from "react";
import { ROBOT_ITEMS } from "@/lib/robots";
import { ProviderBadge } from "@/components/ProviderBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function RobotsGallery() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Robots</h1>
      <p className="text-sm text-muted-foreground mb-6">These are robots. Click to explore models later.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {ROBOT_ITEMS.map((r) => (
          <div key={r.id} className="flex flex-col items-center">
            <Card className="w-full">
              <CardHeader className="pb-2">
                {r.imageUrl && (
                  <div className="relative w-full h-48 mb-2">
                    <Image
                      src={r.imageUrl}
                      alt={r.title}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                )}
                <CardTitle className="text-lg">{r.title}</CardTitle>
                <CardDescription>These are robots.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">View</Button>
              </CardContent>
            </Card>
            <div className="mt-3 flex items-center gap-2">
              <ProviderBadge provider={r.provider ?? "other"} rounded="md" />
              <span className="text-xs text-muted-foreground">Provider</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
