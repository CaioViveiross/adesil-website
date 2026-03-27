import productImg1 from "@/assets/product-labels-1.png";
import productImg2 from "@/assets/product-labels-2.png";
import productImg3 from "@/assets/product-labels-3.png";
import productImg4 from "@/assets/product-labels-4.png";
import catAcougue from "@/assets/category-acougue.jpg";
import catMercado from "@/assets/category-mercado.jpg";
import catHospitalar from "@/assets/category-hospitalar.jpg";
import catPapelaria from "@/assets/category-papelaria.jpg";

const productImages: Record<string, string> = {
  "/product-1": productImg1,
  "/product-2": productImg1,
  "/product-3": productImg3,
  "/product-4": productImg4,
  "/product-5": productImg1,
  "/product-6": productImg2,
  "/product-7": productImg4,
  "/product-8": productImg3,
};

const categoryImages: Record<string, string> = {
  "/biz-acougue": catAcougue,
  "/biz-mercado": catMercado,
  "/biz-hospitalar": catHospitalar,
  "/biz-papelaria": catPapelaria,
};

export function getProductImage(key: string): string {
  return productImages[key] || productImg1;
}

export function getCategoryImage(key: string): string {
  return categoryImages[key] || catAcougue;
}
