"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { MoreHorizontal, PlusCircle, Search } from "lucide-react";

// --- Importaciones de Componentes Shadcn/ui ---
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { chartContainerStyle } from "@/styles/gridStyle";

type ProductoType = Doc<"Producto">;

type ProductoFormState = {
  nombre: string;
  distribuidor: string;
};

const initialState: ProductoFormState = {
  nombre: "",
  distribuidor: "",
};

const ITEMS_PER_PAGE = 5;

export default function ProductosPage() {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<ProductoType | null>(null);
  const [formData, setFormData] = useState<ProductoFormState>(initialState);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const productos = useQuery(api.Producto.getProductos);
  const distribuidores = useQuery(api.Distribuidor.getDistribuidores);
  const createProducto = useMutation(api.Producto.createProducto);
  const updateProducto = useMutation(api.Producto.updateProducto);
  const deleteProducto = useMutation(api.Producto.deleteProducto);

  const distributorMap = useMemo(() => {
    if (!distribuidores) return new Map();
    return new Map(distribuidores.map(d => [d._id, d.nombre]));
  }, [distribuidores]);

  const filteredProductos = useMemo(() => {
    if (!productos) return [];
    if (!searchTerm) return productos;

    const lowercasedFilter = searchTerm.toLowerCase();
    return productos.filter(p => {
      const distributorName = distributorMap.get(p.distribuidor)?.toLowerCase() || '';
      return p.nombre.toLowerCase().includes(lowercasedFilter) ||
             distributorName.includes(lowercasedFilter);
    });
  }, [productos, searchTerm, distributorMap]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const paginatedProductos = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProductos.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProductos, currentPage]);

  const totalPages = Math.ceil(filteredProductos.length / ITEMS_PER_PAGE);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, distribuidor: value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.promise(
      createProducto({
        nombre: formData.nombre,
        distribuidor: formData.distribuidor as Id<"Distribuidor">,
        fecha_registro: Date.now(),
      }),
      {
        loading: "Creando producto...",
        success: "¡Producto creado con éxito!",
        error: (err) => `Error: ${err.data}`,
      }
    );
    setFormData(initialState);
    setCreateDialogOpen(false);
  };

  const handleEdit = (producto: ProductoType) => {
    setSelectedProducto(producto);
    setFormData({
      nombre: producto.nombre,
      distribuidor: producto.distribuidor,
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProducto) return;

    toast.promise(
      updateProducto({
        id: selectedProducto._id,
        nombre: formData.nombre,
        distribuidor: formData.distribuidor as Id<"Distribuidor">,
      }),
      {
        loading: "Actualizando producto...",
        success: "¡Producto actualizado con éxito!",
        error: (err) => `Error: ${err.data}`,
      }
    );
    setEditDialogOpen(false);
    setSelectedProducto(null);
  };

  const confirmDelete = (producto: ProductoType) => {
    setSelectedProducto(producto);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedProducto) return;
    toast.promise(deleteProducto({ id: selectedProducto._id }), {
      loading: "Eliminando producto...",
      success: `Producto "${selectedProducto.nombre}" eliminado.`,
      error: (err) => `Error: ${err.data}`,
    });
    setDeleteDialogOpen(false);
    setSelectedProducto(null);
  };

  if (productos === undefined || distribuidores === undefined) {
    return <div className="p-4 sm:p-6">Cargando datos...</div>;
  }

  return (
    <div className="general-styles">
      <main>
      <Card style={chartContainerStyle}>
        <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <CardTitle>Administración de Productos</CardTitle>
            <CardDescription>
              Crea, edita y elimina los productos de tu inventario.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por producto o distribuidor..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Producto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Distribuidor</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProductos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      {searchTerm ? "No se encontraron resultados." : "Aún no hay productos. ¡Crea el primero!"}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProductos.map((producto) => (
                    <TableRow key={producto._id}>
                      <TableCell className="font-medium">{producto.nombre}</TableCell>
                      <TableCell>{distributorMap.get(producto.distribuidor) || 'Desconocido'}</TableCell>
                      <TableCell>
                        {new Date(producto.fecha_registro).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEdit(producto)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => confirmDelete(producto)}>
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {totalPages > 1 && (
          <CardFooter className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              Mostrando página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                Anterior
              </Button>
              <Button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                Siguiente
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* --- Dialogo para CREAR Producto --- */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Producto</DialogTitle>
              <DialogDescription>
                Completa los datos para registrar un nuevo producto.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="nombre" className="text-left">
                  Nombre
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="distribuidor" className="text-left">
                  Distribuidor
                </Label>
                <Select
                  value={formData.distribuidor}
                  onValueChange={handleSelectChange}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un distribuidor" />
                  </SelectTrigger>
                  <SelectContent>
                    {distribuidores?.map((dist) => (
                      <SelectItem key={dist._id} value={dist._id}>
                        {dist.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row">
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancelar</Button>
              </DialogClose>
              <Button type="submit">Crear Producto</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- Dialogo para EDITAR Producto --- */}
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Editar Producto</DialogTitle>
              <DialogDescription>
                Actualiza los datos del producto seleccionado.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="nombre" className="text-left">
                  Nombre
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="distribuidor" className="text-left">
                  Distribuidor
                </Label>
                <Select
                  value={formData.distribuidor}
                  onValueChange={handleSelectChange}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un distribuidor" />
                  </SelectTrigger>
                  <SelectContent>
                    {distribuidores?.map((dist) => (
                      <SelectItem key={dist._id} value={dist._id}>
                        {dist.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row">
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancelar</Button>
              </DialogClose>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- Dialogo de CONFIRMACIÓN para Eliminar --- */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el producto
              <span className="font-semibold"> {selectedProducto?.nombre}</span> de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row">
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </main>
    </div>
  );
}