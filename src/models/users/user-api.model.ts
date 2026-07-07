import { z } from "zod";
import { API_BASE_URL } from "@/config/api-endpoints";
import { ApiError } from "@/helpers/api.helper";
import {
  RoleSchema,
  UserSchema,
  type Role,
  type User,
} from "@/models/auth/user.model";
import {
  UserCreateSchema,
  type UserCreateInput,
} from "@/models/users/user-create.schema";
import {
  UserUpdateSchema,
  type UserUpdateInput,
  UserUpdatePatchSchema,
  type UserUpdatePatchInput,
} from "@/models/users/user-update.schema";

type JsonRecord = Record<string, unknown>;

const RawUserSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    _id: z.union([z.string(), z.number()]).optional(),
    userNumber: z.union([z.string(), z.number()]).optional(),
    usernumber: z.union([z.string(), z.number()]).optional(),
    user_number: z.union([z.string(), z.number()]).optional(),
    email: z.string(),
    fullName: z.string(),
    jobTitle: z.string().nullish(),
    phone: z.string().nullish(),
    salary: z.coerce.number().nullish(),
    role: z
      .union([
        z.string(),
        z.object({ name: z.string() }).passthrough(),
      ]),
    isActive: z.boolean().optional(),
    status: z.string().optional(),
    profileImage: z.string().nullish(),
    documentImage: z.string().nullish(),
    profileImagePath: z.string().nullish(),
    documentImagePath: z.string().nullish(),
    imageUrl: z.string().nullish(),
    identityDocumentUrl: z.string().nullish(),
  })
  .passthrough();

export const UserListQuerySchema = z.object({
  page: z.coerce.number().int().positive(),
  limit: z.coerce.number().int().positive().max(1000),
  role: z.union([RoleSchema, z.literal("all")]),
  isActive: z.union([z.boolean(), z.literal("all")]),
});

export type UserListQuery = z.infer<typeof UserListQuerySchema>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numberValue(...values: unknown[]): number | undefined {
  for (const value of values) {
    const number = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(number)) return number;
  }
  return undefined;
}

function normalizedRole(value: string | { name: string }): Role {
  const roleName = (typeof value === "string" ? value : value.name).toLowerCase();
  const parsed = RoleSchema.safeParse(roleName);
  if (!parsed.success) throw new ApiError(`دور المستخدم غير معروف: ${roleName}`);
  return parsed.data;
}

function mediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^(?:https?:|data:|blob:)/i.test(path)) return path;
  return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
}

export function normalizeUser(payload: unknown): User {
  const parsed = RawUserSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError("استجابة المستخدم غير مطابقة للنموذج المتوقع.");
  }

  const raw = parsed.data;
  const id = raw.id ?? raw._id;
  if (id === undefined) throw new ApiError("لم يرسل الخادم معرّف المستخدم.");

  const statusValue = raw.status?.toLowerCase();
  const status =
    typeof raw.isActive === "boolean"
      ? raw.isActive
        ? "available"
        : "unavailable"
      : statusValue === "available" || statusValue === "active"
        ? "available"
        : "unavailable";
  const profileImagePath = raw.profileImagePath ?? raw.profileImage ?? undefined;
  const documentImagePath = raw.documentImagePath ?? raw.documentImage ?? undefined;

  return UserSchema.parse({
    id: String(id),
    userNumber:
      raw.userNumber === undefined &&
      raw.usernumber === undefined &&
      raw.user_number === undefined
        ? undefined
        : String(raw.userNumber ?? raw.usernumber ?? raw.user_number),
    fullName: raw.fullName,
    email: raw.email,
    phone: raw.phone ?? "",
    jobTitle: raw.jobTitle ?? "",
    role: normalizedRole(raw.role),
    status,
    salary: raw.salary ?? 0,
    imageUrl: mediaUrl(raw.imageUrl ?? profileImagePath),
    identityDocumentUrl: mediaUrl(raw.identityDocumentUrl ?? documentImagePath),
    profileImagePath,
    documentImagePath,
  });
}

function responseData(payload: unknown): unknown {
  if (!isRecord(payload)) return payload;
  const data = payload.data;
  if (isRecord(data) && "user" in data) return data.user;
  if (data !== undefined && !Array.isArray(data)) return data;
  return payload.user ?? payload;
}

export function normalizeUserResponse(payload: unknown): User {
  return normalizeUser(responseData(payload));
}

export interface NormalizedUserList {
  items: User[];
  total: number;
  page: number;
  limit: number;
}

export function normalizeUserListResponse(
  payload: unknown,
  fallback: Pick<UserListQuery, "page" | "limit">,
): NormalizedUserList {
  const root = isRecord(payload) ? payload : {};
  const data = root.data;
  const dataRecord = isRecord(data) ? data : {};
  const rawItems =
    (Array.isArray(payload) && payload) ||
    (Array.isArray(data) && data) ||
    (Array.isArray(root.users) && root.users) ||
    (Array.isArray(root.items) && root.items) ||
    (Array.isArray(dataRecord.users) && dataRecord.users) ||
    (Array.isArray(dataRecord.items) && dataRecord.items);

  if (!rawItems) throw new ApiError("استجابة قائمة المستخدمين غير مطابقة للنموذج المتوقع.");

  const pagination =
    (isRecord(dataRecord.pagination) && dataRecord.pagination) ||
    (isRecord(dataRecord.meta) && dataRecord.meta) ||
    (isRecord(root.pagination) && root.pagination) ||
    (isRecord(root.meta) && root.meta) ||
    {};
  const items = rawItems.map(normalizeUser);

  return {
    items,
    total:
      numberValue(
        pagination.total,
        pagination.totalCount,
        dataRecord.total,
        root.total,
      ) ?? items.length,
    page:
      numberValue(pagination.page, pagination.currentPage, dataRecord.page, root.page) ??
      fallback.page,
    limit:
      numberValue(
        pagination.limit,
        pagination.pageSize,
        dataRecord.limit,
        root.limit,
      ) ?? fallback.limit,
  };
}

function dataUrlFile(value: string, fallbackName: string): File | null {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/i.exec(value);
  if (!match) return null;

  const bytes = Uint8Array.from(atob(match[2]), (character) => character.charCodeAt(0));
  const extension = match[1].split("/")[1].replace("jpeg", "jpg");
  return new File([bytes], `${fallbackName}.${extension}`, { type: match[1] });
}

function appendImage(formData: FormData, field: string, value: string | undefined) {
  if (!value) return;
  const file = dataUrlFile(value, field);
  if (file) formData.append(field, file);
}

function hasOwn<T extends object>(object: T, key: PropertyKey) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

export function hasUserUpdatePatch(input: UserUpdatePatchInput) {
  return Object.keys(input).length > 0;
}

export function createUserUpdatePatch(
  input: UserUpdateInput,
  currentUser: User,
): UserUpdatePatchInput {
  const parsed = UserUpdateSchema.parse(input);
  const patch: UserUpdatePatchInput = {};

  if (parsed.email !== currentUser.email) patch.email = parsed.email;
  if (parsed.fullName !== currentUser.fullName) patch.fullName = parsed.fullName;
  if ((parsed.jobTitle ?? "") !== (currentUser.jobTitle ?? "")) {
    patch.jobTitle = parsed.jobTitle ?? "";
  }
  if (Number(parsed.salary) !== Number(currentUser.salary)) patch.salary = parsed.salary;
  if (parsed.role !== currentUser.role) patch.role = parsed.role;
  if (parsed.status !== currentUser.status) patch.status = parsed.status;
  if (parsed.password?.trim()) patch.password = parsed.password.trim();

  const nextProfileImage = parsed.imageUrl ?? "";
  const currentProfileImage = currentUser.imageUrl ?? "";
  if (nextProfileImage !== currentProfileImage) {
    const nextProfileFile = dataUrlFile(nextProfileImage, "profileImage");
    if (nextProfileFile) patch.imageUrl = nextProfileImage;
    else if (!nextProfileImage) patch.profileImagePath = "";
  }

  const nextDocumentImage = parsed.identityDocumentUrl ?? "";
  const currentDocumentImage = currentUser.identityDocumentUrl ?? "";
  if (nextDocumentImage !== currentDocumentImage) {
    const nextDocumentFile = dataUrlFile(nextDocumentImage, "documentImage");
    if (nextDocumentFile) patch.identityDocumentUrl = nextDocumentImage;
    else if (!nextDocumentImage) patch.documentImagePath = "";
  }

  return patch;
}

export class CreateUserRequestModel {
  private readonly input: UserCreateInput;

  constructor(input: UserCreateInput) {
    this.input = UserCreateSchema.parse(input);
  }

  toFormData(): FormData {
    const formData = new FormData();
    formData.append("email", this.input.email);
    formData.append("password", this.input.password);
    formData.append("fullName", this.input.fullName);
    if (this.input.jobTitle) formData.append("jobTitle", this.input.jobTitle);
    formData.append("phone", this.input.phone);
    formData.append("salary", String(this.input.salary));
    formData.append("role", this.input.role);
    appendImage(formData, "profileImage", this.input.imageUrl);
    appendImage(formData, "documentImage", this.input.identityDocumentUrl);
    return formData;
  }
}

export class UpdateUserRequestModel {
  private readonly input: UserUpdatePatchInput;

  constructor(input: UserUpdatePatchInput) {
    this.input = UserUpdatePatchSchema.parse(input);
  }

  /** True only when an actual image file needs to be uploaded (multipart). */
  hasFileUploads(): boolean {
    return Boolean(
      (this.input.imageUrl && dataUrlFile(this.input.imageUrl, "profileImage")) ||
        (this.input.identityDocumentUrl &&
          dataUrlFile(this.input.identityDocumentUrl, "documentImage")),
    );
  }

  /**
   * JSON payload used when there is no file upload. Sending JSON keeps numeric
   * fields (salary) as real numbers instead of multipart strings, which the
   * backend validator requires.
   */
  toJSON(): Record<string, unknown> {
    const body: Record<string, unknown> = {};
    if (hasOwn(this.input, "email")) body.email = this.input.email ?? "";
    if (hasOwn(this.input, "fullName")) body.fullName = this.input.fullName ?? "";
    if (hasOwn(this.input, "jobTitle")) body.jobTitle = this.input.jobTitle ?? "";
    if (hasOwn(this.input, "salary")) body.salary = Number(this.input.salary);
    if (hasOwn(this.input, "status")) body.isActive = this.input.status === "available";
    if (hasOwn(this.input, "role")) body.role = this.input.role ?? "";
    if (hasOwn(this.input, "password") && this.input.password) {
      body.password = this.input.password;
    }
    if (hasOwn(this.input, "profileImagePath")) {
      body.profileImagePath = this.input.profileImagePath ?? "";
    }
    if (hasOwn(this.input, "documentImagePath")) {
      body.documentImagePath = this.input.documentImagePath ?? "";
    }
    return body;
  }

  toFormData(): FormData {
    const formData = new FormData();
    if (hasOwn(this.input, "email")) formData.append("email", this.input.email ?? "");
    if (hasOwn(this.input, "fullName")) {
      formData.append("fullName", this.input.fullName ?? "");
    }
    if (hasOwn(this.input, "jobTitle")) {
      formData.append("jobTitle", this.input.jobTitle ?? "");
    }
    if (hasOwn(this.input, "salary")) formData.append("salary", String(this.input.salary));
    if (hasOwn(this.input, "status")) {
      formData.append("isActive", String(this.input.status === "available"));
    }
    if (hasOwn(this.input, "role")) formData.append("role", this.input.role ?? "");
    if (hasOwn(this.input, "password") && this.input.password) {
      formData.append("password", this.input.password);
    }

    const profileFile = this.input.imageUrl
      ? dataUrlFile(this.input.imageUrl, "profileImage")
      : null;
    if (profileFile) formData.append("profileImage", profileFile);
    if (hasOwn(this.input, "profileImagePath")) {
      formData.append("profileImagePath", this.input.profileImagePath ?? "");
    }

    const documentFile = this.input.identityDocumentUrl
      ? dataUrlFile(this.input.identityDocumentUrl, "documentImage")
      : null;
    if (documentFile) formData.append("documentImage", documentFile);
    if (hasOwn(this.input, "documentImagePath")) {
      formData.append("documentImagePath", this.input.documentImagePath ?? "");
    }

    return formData;
  }
}
