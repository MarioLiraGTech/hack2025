"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { MoreHorizontal, PlusCircle, Trash2, ArrowRight } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox"; 

type VueloType = Doc<"Vuelo">;
type CantidadEnVuelo = { cantidad: number; producto: Id<"Cantidad"> };
type CantidadSobrante = CantidadEnVuelo & { sobrante: number };

// --- Formularios ---
const initialCreateState = {
  carrito_id: "",
  sucursal_origen: "",
  sucursal_destino: "",
  cantidad: [] as CantidadEnVuelo[],
};

const initialCompleteState = {
  vueloId: "" as Id<"Vuelo">,
  cantidad: [] as CantidadSobrante[],
};

// --- Componente Principal ---
export default function VuelosPage() {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedVuelo, setSelectedVuelo] = useState<VueloType | null>(null);

  const [createForm, setCreateForm] = useState(initialCreateState);
  const [completeForm, setCompleteForm] = useState(initialCompleteState);
  
  // State for the temporary product selection in the create form
  const [tempProduct, setTempProduct] = useState({ producto: "", cantidad: "" });

  // --- Hooks de Convex ---
  const vuelos = useQuery(api.Vuelo.getVuelos);
  const carritos = useQuery(api.Carrito.getCarritos);
  const sucursales = useQuery(api.Sucursal.getSucursales);
  const inventario = useQuery(api.Cantidad.getCantidades);
  const productos = useQuery(api.Producto.getProductos);

  const createVuelo = useMutation(api.Vuelo.createVuelo);
  const completeVuelo = useMutation(api.Vuelo.completeVuelo);

  // --- Funciones Helper ---
  const getNombre = (id: string, list?: { _id: string; nombre: string }[]): string => list?.find(item => item._id === id)?.nombre || "Cargando...";
  const getProductoNombreFromCantidadId = (cantidadId: Id<"Cantidad">): string => {
    const itemInventario = inventario?.find(inv => inv._id === cantidadId);
    if (!itemInventario) return "Desconocido";
    return getNombre(itemInventario.producto_id, productos);
  };
  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString("es-MX");

  // --- Lógica de Formularios ---
  const inventarioEnOrigen = useMemo(() => {
    if (!inventario || !createForm.sucursal_origen) return [];
    return inventario
      .filter(item => item.sucursal_id === createForm.sucursal_origen && item.cantidad > 0)
      .map(item => ({
        value: item._id,
        label: `${getProductoNombreFromCantidadId(item._id)} (Stock: ${item.cantidad}, Cad: ${formatDate(item.fecha_caducidad)})`
      }));
  }, [inventario, createForm.sucursal_origen, productos]);

  const handleAddProductToVuelo = () => {
    if (!tempProduct.producto || !tempProduct.cantidad) {
      toast.error("Selecciona un producto y una cantidad.");
      return;
    }
    const newProduct: CantidadEnVuelo = {
      producto: tempProduct.producto as Id<"Cantidad">,
      cantidad: Number(tempProduct.cantidad),
    };
    setCreateForm(prev => ({...prev, cantidad: [...prev.cantidad, newProduct]}));
    setTempProduct({ producto: "", cantidad: "" });
  };
  
  const handleRemoveProductFromVuelo = (index: number) => {
    setCreateForm(prev => ({...prev, cantidad: prev.cantidad.filter((_, i) => i !== index)}));
  };

  // --- Manejadores de Mutaciones ---
  const handleCreateVuelo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createForm.cantidad.length === 0) {
      toast.error("Debes añadir al menos un producto al vuelo.");
      return;
    }
    toast.promise(createVuelo({
      ...createForm,
      carrito_id: createForm.carrito_id as Id<"Carrito">,
      sucursal_origen: createForm.sucursal_origen as Id<"Sucursal">,
      sucursal_destino: createForm.sucursal_destino as Id<"Sucursal">,
    }), {
      loading: "Iniciando traslado...",
      success: "¡Traslado iniciado con éxito!",
      error: (err) => `Error: ${err.message}`,
    });
    setCreateDialogOpen(false);
    setCreateForm(initialCreateState);
  };
  
  const handleCompleteVuelo = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.promise(completeVuelo(completeForm), {
      loading: "Completando traslado...",
      success: "¡Traslado completado!",
      error: (err) => `Error: ${err.message}`,
    });
    setCompleteDialogOpen(false);
  };

  const openCompleteDialog = (vuelo: VueloType) => {
    setSelectedVuelo(vuelo);
    setCompleteForm({
      vueloId: vuelo._id,
      cantidad: vuelo.cantidad.map(item => ({ ...item, sobrante: item.cantidad }))
    });
    setCompleteDialogOpen(true);
  };

  if (!vuelos || !carritos || !sucursales || !inventario || !productos) {
    return <div className="p-4 sm:p-6">Cargando datos de traslados...</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Administración de Traslados</CardTitle>
            <CardDescription>Inicia y completa los traslados de inventario entre sucursales.</CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="w-full md:w-auto shrink-0">
            <PlusCircle className="mr-2 h-4 w-4" />
            Iniciar Traslado
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estado</TableHead>
                  <TableHead>Carrito</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead><span className="sr-only">Acciones</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vuelos.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center">No hay traslados registrados.</TableCell></TableRow>
                ) : (
                  vuelos.map((vuelo) => (
                    <TableRow key={vuelo._id}>
                      <TableCell>
                        <Badge variant={vuelo.completado ? "default" : "secondary"}>
                          {vuelo.completado ? "Completado" : "En Tránsito"}
                        </Badge>
                      </TableCell>
                      <TableCell>{getNombre(vuelo.carrito_id, carritos)}</TableCell>
                      <TableCell>{getNombre(vuelo.sucursal_origen, sucursales)}</TableCell>
                      <TableCell>{getNombre(vuelo.sucursal_destino, sucursales)}</TableCell>
                      <TableCell>{formatDate(vuelo.fecha_registro)}</TableCell>
                      <TableCell>
                        {!vuelo.completado && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openCompleteDialog(vuelo)}>
                                Completar Traslado
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* --- Dialogo para CREAR Vuelo (Iniciar Traslado) --- */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={handleCreateVuelo}>
            <DialogHeader>
              <DialogTitle>Iniciar Nuevo Traslado</DialogTitle>
              <DialogDescription>Selecciona origen, destino y los productos a enviar.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              {/* Selectores Principales */}
              <div className="flex flex-col gap-2">
                <Label>Sucursal de Origen</Label>
                <Combobox options={sucursales.map(s => ({ value: s._id, label: s.nombre }))} value={createForm.sucursal_origen} onChange={val => setCreateForm(p => ({ ...p, sucursal_origen: val }))} placeholder="Selecciona origen" searchPlaceholder="Buscar sucursal..." />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Sucursal de Destino</Label>
                <Combobox options={sucursales.map(s => ({ value: s._id, label: s.nombre }))} value={createForm.sucursal_destino} onChange={val => setCreateForm(p => ({ ...p, sucursal_destino: val }))} placeholder="Selecciona destino" searchPlaceholder="Buscar sucursal..." />
              </div>
              <div className="flex flex-col gap-2 col-span-full">
                <Label>Carrito Asignado</Label>
                <Combobox options={carritos.map(c => ({ value: c._id, label: c.nombre }))} value={createForm.carrito_id} onChange={val => setCreateForm(p => ({ ...p, carrito_id: val }))} placeholder="Selecciona un carrito" searchPlaceholder="Buscar carrito..." />
              </div>

              {/* Sección para añadir productos */}
              <div className="col-span-full border-t pt-4 mt-2">
                <h4 className="font-semibold mb-2">Productos a Enviar</h4>
                {createForm.sucursal_origen ? (
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label>Producto en Inventario</Label>
                      <Combobox options={inventarioEnOrigen} value={tempProduct.producto} onChange={val => setTempProduct(p => ({ ...p, producto: val }))} placeholder="Selecciona un producto del stock" searchPlaceholder="Buscar producto..." />
                    </div>
                    <div className="w-24">
                      <Label>Cantidad</Label>
                      <Input type="number" value={tempProduct.cantidad} onChange={e => setTempProduct(p => ({ ...p, cantidad: e.target.value }))} placeholder="0" />
                    </div>
                    <Button type="button" onClick={handleAddProductToVuelo}>Agregar</Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Selecciona una sucursal de origen para ver el inventario.</p>
                )}
              </div>

              {/* Lista de productos añadidos */}
              <div className="col-span-full max-h-40 overflow-y-auto space-y-2">
                {createForm.cantidad.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm bg-muted p-2 rounded-md">
                    <span>{getProductoNombreFromCantidadId(item.producto)} - <span className="font-bold">{item.cantidad}</span> uds.</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveProductFromVuelo(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
              <Button type="submit">Iniciar Traslado</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* --- Dialogo para COMPLETAR Vuelo --- */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCompleteVuelo}>
            <DialogHeader>
              <DialogTitle>Completar Traslado</DialogTitle>
              <DialogDescription>
                Registra la cantidad de productos que realmente llegaron a la sucursal de destino.
                <div className="flex items-center gap-2 font-semibold mt-2">
                  <span>{getNombre(selectedVuelo?.sucursal_origen || "", sucursales)}</span>
                  <ArrowRight className="h-4 w-4" />
                  <span>{getNombre(selectedVuelo?.sucursal_destino || "", sucursales)}</span>
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4 max-h-80 overflow-y-auto">
              {completeForm.cantidad.map((item, index) => (
                <div key={item.producto} className="grid grid-cols-3 items-center gap-2">
                  <Label className="col-span-1 truncate">{getProductoNombreFromCantidadId(item.producto)}</Label>
                  <div className="col-span-2 flex items-center gap-2 text-sm">
                    <Input
                      type="number"
                      value={item.sobrante}
                      onChange={(e) => {
                        const newCantidad = [...completeForm.cantidad];
                        newCantidad[index].sobrante = Number(e.target.value);
                        setCompleteForm(prev => ({...prev, cantidad: newCantidad}));
                      }}
                    />
                    <span className="text-muted-foreground">/ {item.cantidad} enviados</span>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
              <Button type="submit">Completar Traslado</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}