import type { RepairRequest } from "@/models/requests/request.model";

export function primaryDevice(request: RepairRequest) {
  const first = request.devices[0];
  if (!first) return "غير محدد";
  const name = first.deviceName || first.deviceType || "غير محدد";
  return first.brand ? `${name} / ${first.brand}` : name;
}

export function isLikelyIdentifier(value: string) {
  const trimmed = value.trim();
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      trimmed,
    ) || /^[0-9a-f]{24}$/i.test(trimmed)
  );
}

export function technicianDisplayName(
  request: RepairRequest,
  usersById: Map<string, string>,
) {
  const fromTechnicianId = usersById.get(request.technicianId);
  if (fromTechnicianId) return fromTechnicianId;

  const fromNameAsId = usersById.get(request.technicianName);
  if (fromNameAsId) return fromNameAsId;

  if (request.technicianName && !isLikelyIdentifier(request.technicianName)) {
    return request.technicianName;
  }

  return "غير محدد";
}
