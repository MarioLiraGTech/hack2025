// app/dashboard/cantidades/page.tsx

"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { CalendarIcon, MoreHorizontal, PlusCircle, Search } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// --- Importaciones de Componentes Shadcn/ui ---
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Combobox } from "@/components/ui/combobox";

// --- Tipos Específicos para Cantidad ---
type CantidadType = Doc<"Cantidad">;

// ✅ Este tipo ya no incluye 'lote'
type CantidadFormState = {
  cantidad: string;
  fecha_caducidad?: Date;
  producto_id: string;
  sucursal_id: string;
};

// --- Estado Inicial del Formulario ---
// ✅ Este estado inicial ya no incluye 'lote'
const initialState: CantidadFormState = {
  cantidad: "",
  fecha_caducidad: undefined,
  producto_id: "",
  sucursal_id: "",
};


// --- Componente Principal de la Página ---
export default function CantidadesPage() {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCantidad, setSelectedCantidad] = useState<CantidadType | null>(null);
  const [formData, setFormData] = useState<CantidadFormState>(initialState);
  const [searchTerm, setSearchTerm] = useState("");

  const cantidades = useQuery(api.Cantidad.getCantidades);
  const createCantidad = useMutation(api.Cantidad.createCantidad);
  const updateCantidad = useMutation(api.Cantidad.updateCantidad);
  const deleteCantidad = useMutation(api.Cantidad.deleteCantidad);
  const productos = useQuery(api.Producto.getProductos);
  const sucursales = useQuery(api.Sucursal.getSucursales);

  const getProductoNombre = useCallback((id: Id<"Producto">): string => {
    return productos?.find(p => p._id === id)?.nombre || id;
  }, [productos]);

  // Envuelve la función en useCallback y le dices que solo depende de 'sucursales'
  const getSucursalNombre = useCallback((id: Id<"Sucursal">): string => {
    return sucursales?.find(s => s._id === id)?.nombre || id;
  }, [sucursales]);

  const filteredCantidades = useMemo(() => {
    if (!cantidades || !productos || !sucursales) return [];
    
    const lowercasedFilter = searchTerm.toLowerCase();
    
    return cantidades.filter((item) => {
      const productoNombre = getProductoNombre(item.producto_id).toLowerCase();
      const sucursalNombre = getSucursalNombre(item.sucursal_id).toLowerCase();
      return productoNombre.includes(lowercasedFilter) || sucursalNombre.includes(lowercasedFilter);
    });
  }, [searchTerm, cantidades, productos, sucursales, getProductoNombre, getSucursalNombre]);

  const productoOptions = useMemo(() => productos?.map(p => ({ value: p._id, label: p.nombre })) || [], [productos]);
  const sucursalOptions = useMemo(() => sucursales?.map(s => ({ value: s._id, label: s.nombre })) || [], [sucursales]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: "producto_id" | "sucursal_id", value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (date?: Date) => {
    setFormData((prev) => ({ ...prev, fecha_caducidad: date }));
  };
  
  // ✅ Esta función ya no hace referencia a 'lote'
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fecha_caducidad || !formData.producto_id || !formData.sucursal_id) {
      toast.error("Por favor, completa todos los campos.");
      return;
    }
  
    toast.promise(createCantidad({
      ...formData,
      cantidad: Number(formData.cantidad), // Se convierte a número aquí
      fecha_caducidad: formData.fecha_caducidad.getTime(),
      producto_id: formData.producto_id as Id<"Producto">,
      sucursal_id: formData.sucursal_id as Id<"Sucursal">,
    }), {
      loading: "Registrando cantidad...",
      success: "¡Cantidad registrada con éxito!",
      error: (err) => `Error: ${err.data}`,
    });

    setFormData(initialState);
    setCreateDialogOpen(false);
  };

  // ✅ Esta función ya no hace referencia a 'lote'
  const handleEdit = (cantidad: CantidadType) => {
    setSelectedCantidad(cantidad);
    setFormData({
      cantidad: String(cantidad.cantidad),
      fecha_caducidad: new Date(cantidad.fecha_caducidad),
      producto_id: cantidad.producto_id,
      sucursal_id: cantidad.sucursal_id,
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCantidad || !formData.fecha_caducidad) return;
    toast.promise(
      updateCantidad({ 
        id: selectedCantidad._id,
        ...formData,
        cantidad: Number(formData.cantidad),
        fecha_caducidad: formData.fecha_caducidad.getTime(),
        producto_id: formData.producto_id as Id<"Producto">,
        sucursal_id: formData.sucursal_id as Id<"Sucursal">,
      }),
      {
        loading: "Actualizando cantidad...",
        success: "¡Cantidad actualizada con éxito!",
        error: (err) => `Error: ${err.data}`,
      }
    );
    setEditDialogOpen(false);
    setSelectedCantidad(null);
  };

  const confirmDelete = (cantidad: CantidadType) => {
    setSelectedCantidad(cantidad);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedCantidad) return;
    toast.promise(deleteCantidad({ id: selectedCantidad._id }), {
      loading: "Eliminando registro...",
      success: `Registro eliminado.`,
      error: (err) => `Error: ${err.data}`,
    });
    setDeleteDialogOpen(false);
    setSelectedCantidad(null);
  };

  if (cantidades === undefined || productos === undefined || sucursales === undefined) {
    return <div className="p-4 sm:p-6">Cargando inventario...</div>;
  }
  
  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString("es-MX");

  const isExpiringSoon = (timestamp: number) => {
    const expiryDate = new Date(timestamp);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 5;
  };

  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Administración de Inventario</CardTitle>
            <CardDescription>
              Registra, edita y elimina las cantidades de productos en sucursales.
            </CardDescription>
          </div>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por producto o sucursal..."
                className="w-full pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} className="w-full md:w-auto shrink-0">
              <PlusCircle className="mr-2 h-4 w-4" />
              Registrar Cantidad
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Fecha Caducidad</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead><span className="sr-only">Acciones</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCantidades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No se encontraron resultados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCantidades.map((item) => (
                    <TableRow 
                      key={item._id}
                      className={cn(
                        isExpiringSoon(item.fecha_caducidad) && "bg-red-500/30"
                      )}
                    >
                      <TableCell className="font-medium">{getProductoNombre(item.producto_id)}</TableCell>
                      <TableCell>{getSucursalNombre(item.sucursal_id)}</TableCell>
                      <TableCell>{item.cantidad}</TableCell>
                      <TableCell>{formatDate(item.fecha_caducidad)}</TableCell>
                      <TableCell>{formatDate(item.fecha_registro)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEdit(item)}>Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => confirmDelete(item)}>Eliminar</DropdownMenuItem>
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
      </Card>

      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={isCreateDialogOpen ? setCreateDialogOpen : setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={isCreateDialogOpen ? handleCreate : handleUpdate}>
            <DialogHeader>
              <DialogTitle>{isCreateDialogOpen ? 'Registrar Nueva Cantidad' : 'Editar Cantidad'}</DialogTitle>
              <DialogDescription>Completa los datos del producto en la sucursal.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label>Producto</Label>
                <Combobox
                  options={productoOptions}
                  value={formData.producto_id}
                  onChange={(value) => handleSelectChange("producto_id", value)}
                  placeholder="Selecciona un producto"
                  searchPlaceholder="Buscar producto..."
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Sucursal</Label>
                <Combobox
                  options={sucursalOptions}
                  value={formData.sucursal_id}
                  onChange={(value) => handleSelectChange("sucursal_id", value)}
                  placeholder="Selecciona una sucursal"
                  searchPlaceholder="Buscar sucursal..."
                />
              </div>
              {/* ✅ El campo de input para 'lote' ya no está aquí */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="cantidad">Cantidad</Label>
                <Input id="cantidad" type="number" value={formData.cantidad} onChange={handleInputChange} required placeholder="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Fecha de Caducidad</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("justify-start text-left font-normal", !formData.fecha_caducidad && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.fecha_caducidad ? format(formData.fecha_caducidad, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.fecha_caducidad} onSelect={handleDateChange} initialFocus /></PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row">
              <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
              <Button type="submit">{isCreateDialogOpen ? 'Registrar' : 'Guardar Cambios'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará permanentemente este registro de inventario.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Sí, eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}