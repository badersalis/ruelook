"use client";

import { Suspense, useEffect, useState, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { config, imageUrl } from "@/lib/config";
import {
  adminGetProduct,
  checkImageFile,
  listCategories,
  productFormSchema,
  slugify,
  uploadProductImage,
  type AdminProduct,
  type ProductFormInput,
  type ProductFormValues,
} from "@/lib/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const input = "h-12 w-full rounded-[var(--radius-sm)] border border-ink-soft/60 bg-surface px-4 text-[16px] aria-[invalid=true]:border-danger";

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[14px] font-medium">{label}</label>
      {children}
      {error && <p id={`${id}-err`} className="mt-1 text-[13px] text-danger">{error}</p>}
    </div>
  );
}

function toForm(p: AdminProduct | null): ProductFormInput {
  const c = p?.product_colors[0];
  return {
    name: p?.name ?? "",
    slug: p?.slug ?? "",
    category_id: p?.category_id ?? 0,
    description: p?.description ?? "",
    material_care: p?.material_care ?? "",
    price: p ? p.price_cents / 100 : 0,
    status: p?.status ?? "draft",
    color_name: c?.name ?? "",
    color_hex: c?.hex ?? "#16171A",
    variants: p?.product_variants.map((v) => ({ id: v.id, size: v.size, stock: v.stock })) ?? [{ size: "M", stock: 0 }],
  };
}

function Images({ product }: { product: AdminProduct }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const images = product.product_images;
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-product", product.id] });

  const onFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files ?? [])];
    e.target.value = "";
    const problems = files.map(checkImageFile).filter(Boolean) as string[];
    if (problems.length) return setError(problems.join(" "));
    setError(null);
    setBusy(true);
    try {
      let sort = images.length;
      for (const f of files) await uploadProductImage(product.id, f, sort++, `${product.name}, view ${sort}`);
      toast.show(files.length === 1 ? "Image uploaded" : `${files.length} images uploaded`);
    } catch {
      setError("Upload failed. Check the file and try again.");
    } finally {
      setBusy(false);
      refresh();
    }
  };

  const move = async (i: number, dir: -1 | 1) => {
    const a = images[i], b = images[i + dir];
    if (!a || !b) return;
    setBusy(true);
    await Promise.all([
      supabase.from("product_images").update({ sort: b.sort }).eq("id", a.id),
      supabase.from("product_images").update({ sort: a.sort }).eq("id", b.id),
    ]);
    setBusy(false);
    refresh();
  };

  const remove = async (id: string, path: string) => {
    if (!window.confirm("Remove this image from the product?")) return;
    setBusy(true);
    const { error } = await supabase.from("product_images").delete().eq("id", id);
    // Seed images are static files (D-011); only uploaded files live in Storage
    if (!error && !path.startsWith("static/")) await supabase.storage.from(config.storageBucket).remove([path]);
    setBusy(false);
    if (error) setError("Couldn't remove the image.");
    refresh();
  };

  return (
    <section aria-labelledby="img-title" className="flex flex-col gap-4">
      <h2 id="img-title" className="font-display text-[20px] font-bold">Images</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((im, i) => (
          <li key={im.id} className="flex flex-col gap-2">
            <img src={imageUrl(im.path, 640)} alt={im.alt} className="aspect-[4/5] w-full bg-plinth object-cover" />
            <div className="flex justify-between">
              <button type="button" disabled={busy || i === 0} onClick={() => move(i, -1)} className="grid size-11 place-items-center disabled:opacity-30" aria-label={`Move image ${i + 1} earlier`}><ArrowUp className="size-4" aria-hidden /></button>
              <button type="button" disabled={busy || i === images.length - 1} onClick={() => move(i, 1)} className="grid size-11 place-items-center disabled:opacity-30" aria-label={`Move image ${i + 1} later`}><ArrowDown className="size-4" aria-hidden /></button>
              <button type="button" disabled={busy} onClick={() => remove(im.id, im.path)} className="grid size-11 place-items-center text-danger disabled:opacity-30" aria-label={`Remove image ${i + 1}`}><Trash2 className="size-4" aria-hidden /></button>
            </div>
          </li>
        ))}
      </ul>
      <div>
        <label htmlFor="img-upload" className="mb-1 block text-[14px] font-medium">Upload images</label>
        <input id="img-upload" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={onFiles} aria-describedby="img-hint" className="text-[14px]" />
        <p id="img-hint" className="mt-1 text-[13px] text-ink-soft">JPG, PNG or WebP, up to 5 MB each. The first image is the cover.</p>
      </div>
      {busy && <p role="status" className="text-[14px]">Working…</p>}
      {error && <p role="alert" className="text-[14px] text-danger">{error}</p>}
    </section>
  );
}

function Editor() {
  const id = useSearchParams().get("id");
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const cats = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const prod = useQuery({ queryKey: ["admin-product", id], queryFn: () => adminGetProduct(id!), enabled: !!id });
  const product = prod.data ?? null;

  const form = useForm<ProductFormInput, unknown, ProductFormValues>({ resolver: zodResolver(productFormSchema), defaultValues: toForm(null) });
  const { register, handleSubmit, reset, setValue, watch, control, formState } = form;
  const { errors, isSubmitting, dirtyFields } = formState;
  const variants = useFieldArray({ control, name: "variants" });

  useEffect(() => {
    if (product) reset(toForm(product));
  }, [product, reset]);

  const name = watch("name");
  useEffect(() => {
    if (!id && !dirtyFields.slug) setValue("slug", slugify(name ?? ""));
  }, [name, id, dirtyFields.slug, setValue]);

  const onSubmit = async (v: ProductFormValues) => {
    setServerError(null);
    const row = {
      name: v.name, slug: v.slug, category_id: v.category_id, description: v.description,
      material_care: v.material_care, price_cents: Math.round(v.price * 100), status: v.status,
    };
    const saved = id
      ? await supabase.from("products").update(row).eq("id", id).select("id").single()
      : await supabase.from("products").insert({ ...row, drop_label: "Drop 07" }).select("id").single();
    if (saved.error || !saved.data) {
      setServerError(saved.error?.code === "23505" ? "That slug is already used by another product." : "Couldn't save the product.");
      return;
    }
    const pid = saved.data.id;
    let colorId = product?.product_colors[0]?.id;
    if (colorId) await supabase.from("product_colors").update({ name: v.color_name, hex: v.color_hex }).eq("id", colorId);
    else {
      const c = await supabase.from("product_colors").insert({ product_id: pid, name: v.color_name, hex: v.color_hex }).select("id").single();
      colorId = c.data?.id;
    }
    for (const x of v.variants) {
      const res = x.id
        ? await supabase.from("product_variants").update({ size: x.size, stock: x.stock }).eq("id", x.id)
        : await supabase.from("product_variants").insert({ product_id: pid, color_id: colorId ?? null, size: x.size, stock: x.stock });
      if (res.error) {
        setServerError(res.error.code === "23505" ? `Size "${x.size}" is listed twice.` : "Saved the product, but some sizes failed to save.");
        break;
      }
    }
    await qc.invalidateQueries({ queryKey: ["admin-products"] });
    await qc.invalidateQueries({ queryKey: ["admin-product", pid] });
    toast.show(id ? "Product saved" : "Product created");
    if (!id) router.replace(`/admin/product/?id=${pid}`);
  };

  if (id && prod.isLoading) return <div className="skeleton h-96 motion-safe:animate-pulse" />;
  if (id && !product) return <p role="alert">Product not found.</p>;

  const err = (k: keyof ProductFormValues) => (errors[k]?.message as string | undefined) ?? undefined;
  const aria = (k: keyof ProductFormValues) => ({ "aria-invalid": !!errors[k] || undefined, "aria-describedby": errors[k] ? `p-${k}-err` : undefined });

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        <Field id="p-name" label="Name" error={err("name")}><input id="p-name" {...register("name")} {...aria("name")} className={input} /></Field>
        <Field id="p-slug" label="Slug (URL)" error={err("slug")}><input id="p-slug" {...register("slug")} {...aria("slug")} className={input} /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="p-category_id" label="Category" error={err("category_id")}>
            <select id="p-category_id" {...register("category_id")} {...aria("category_id")} className={input}>
              <option value={0}>Choose…</option>
              {cats.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field id="p-price" label="Price (USD)" error={err("price")}><input id="p-price" type="number" step="0.01" min="0" inputMode="decimal" {...register("price")} {...aria("price")} className={input} /></Field>
          <Field id="p-status" label="Status">
            <select id="p-status" {...register("status")} className={input}>
              <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
            </select>
          </Field>
        </div>
        <Field id="p-description" label="Description" error={err("description")}>
          <textarea id="p-description" rows={4} {...register("description")} className={`${input} h-auto py-3`} />
        </Field>
        <Field id="p-material_care" label="Material & care" error={err("material_care")}>
          <textarea id="p-material_care" rows={2} {...register("material_care")} className={`${input} h-auto py-3`} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <Field id="p-color_name" label="Colour name" error={err("color_name")}><input id="p-color_name" {...register("color_name")} {...aria("color_name")} className={input} /></Field>
          <Field id="p-color_hex" label="Swatch hex" error={err("color_hex")}><input id="p-color_hex" {...register("color_hex")} {...aria("color_hex")} className={input} /></Field>
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-[14px] font-medium">Sizes &amp; stock</legend>
          {variants.fields.map((f, i) => (
            <div key={f.id} className="grid grid-cols-[1fr_1fr_44px] items-end gap-3">
              <div>
                <label htmlFor={`v-size-${i}`} className="sr-only">Size {i + 1}</label>
                <input id={`v-size-${i}`} placeholder="Size" {...register(`variants.${i}.size`)} aria-invalid={!!errors.variants?.[i]?.size || undefined} className={input} />
              </div>
              <div>
                <label htmlFor={`v-stock-${i}`} className="sr-only">Stock for size {i + 1}</label>
                <input id={`v-stock-${i}`} type="number" min="0" placeholder="Stock" {...register(`variants.${i}.stock`)} className={input} />
              </div>
              {/* Existing variants may be referenced by orders: set stock to 0 instead of deleting */}
              {!watch(`variants.${i}.id`) ? (
                <button type="button" onClick={() => variants.remove(i)} className="grid size-11 place-items-center text-danger" aria-label={`Remove size ${i + 1}`}><Trash2 className="size-4" aria-hidden /></button>
              ) : <span />}
            </div>
          ))}
          {errors.variants?.message && <p className="text-[13px] text-danger">{errors.variants.message}</p>}
          <Button type="button" variant="ghost" className="self-start" onClick={() => variants.append({ size: "", stock: 0 })}><Plus className="size-4" aria-hidden /> Add size</Button>
          <p className="text-[13px] text-ink-soft">Sizes already on orders can&apos;t be removed; set their stock to 0.</p>
        </fieldset>

        {serverError && <p role="alert" className="text-[14px] text-danger">{serverError}</p>}
        <Button type="submit" loading={isSubmitting} className="self-start">{id ? "Save changes" : "Create product"}</Button>
      </form>

      {product ? <Images product={product} /> : <p className="text-[14px] text-ink-soft">Save the product to add images.</p>}
    </div>
  );
}

function EditorPage() {
  const id = useSearchParams().get("id");
  return (
    <AdminShell title={id ? "Edit product" : "New product"}>
      <Editor />
    </AdminShell>
  );
}

export default function AdminProductPage() {
  return (
    <Suspense fallback={null}>
      <EditorPage />
    </Suspense>
  );
}
