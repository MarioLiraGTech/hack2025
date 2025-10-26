"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { MoreHorizontal, PlusCircle, Trash2, ArrowRight, BrainCircuit, Loader2, CalendarIcon, ArrowLeft, Search } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// --- Importaciones de Componentes Shadcn/ui ---
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { chartContainerStyle } from "@/styles/gridStyle";

// --- Tipos Específicos ---
type VueloType = Doc<"Vuelo">;
type CantidadEnVuelo = { cantidad: number; producto: Id<"Cantidad"> };
type CantidadSobrante = CantidadEnVuelo & { sobrante: number };

// --- Formularios ---
const initialCreateState = { carrito_id: "", sucursal_origen: "", sucursal_destino: "", cantidad: [] as CantidadEnVuelo[] };
const initialCompleteState = { vueloId: "" as Id<"Vuelo">, cantidad: [] as CantidadSobrante[] };
const initialPredictionState = { Origin: "MTY", Date: new Date(), Flight_Type: "medium-haul" as "medium-haul" | "long-haul", Passenger_Count: 150 };

const ITEMS_PER_PAGE = 10;

// --- Componente Principal ---
export default function VuelosPage() {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedVuelo, setSelectedVuelo] = useState<VueloType | null>(null);
  const [showPrediction, setShowPrediction] = useState(false);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [predictions, setPredictions] = useState<Record<string, number> | null>(null);
  const [predictionForm, setPredictionForm] = useState(initialPredictionState);
  const [createForm, setCreateForm] = useState(initialCreateState);
  const [completeForm, setCompleteForm] = useState(initialCompleteState);
  const [tempProduct, setTempProduct] = useState({ producto: "", cantidad: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const vuelos = useQuery(api.Vuelo.getVuelos);
  const carritos = useQuery(api.Carrito.getCarritos);
  const sucursales = useQuery(api.Sucursal.getSucursales);
  const inventario = useQuery(api.Cantidad.getCantidades);
  const productos = useQuery(api.Producto.getProductos);

  const createVuelo = useMutation(api.Vuelo.createVuelo);
  const completeVuelo = useMutation(api.Vuelo.completeVuelo);

  const getNombre = (id: string, list?: { _id: string; nombre: string }[]): string => list?.find(item => item._id === id)?.nombre || "Cargando...";
  const getProductoNombreFromCantidadId = (cantidadId: Id<"Cantidad">): string => {
    const itemInventario = inventario?.find(inv => inv._id === cantidadId);
    return itemInventario ? getNombre(itemInventario.producto_id, productos) : "Desconocido";
  };
  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString("es-MX");

  const filteredVuelos = useMemo(() => {
    if (!vuelos) return [];
    if (!searchTerm) return vuelos;
    const lowercasedFilter = searchTerm.toLowerCase();
    return vuelos.filter(vuelo => {
      const carritoNombre = getNombre(vuelo.carrito_id, carritos).toLowerCase();
      const origenNombre = getNombre(vuelo.sucursal_origen, sucursales).toLowerCase();
      const destinoNombre = getNombre(vuelo.sucursal_destino, sucursales).toLowerCase();
      const estado = (vuelo.completado ? "completado" : "en tránsito").toLowerCase();
      return carritoNombre.includes(lowercasedFilter) || origenNombre.includes(lowercasedFilter) || destinoNombre.includes(lowercasedFilter) || estado.includes(lowercasedFilter);
    });
  }, [vuelos, searchTerm, carritos, sucursales]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const paginatedVuelos = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredVuelos.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredVuelos, currentPage]);

  const totalPages = Math.ceil(filteredVuelos.length / ITEMS_PER_PAGE);
  
  const inventarioEnOrigen = useMemo(() => {
    if (!inventario || !createForm.sucursal_origen) return [];
    return inventario
      .filter(item => item.sucursal_id === createForm.sucursal_origen && item.cantidad > 0)
      .map(item => ({ value: item._id, label: `${getProductoNombreFromCantidadId(item._id)} (Stock: ${item.cantidad}, Cad: ${formatDate(item.fecha_caducidad)})` }));
  }, [inventario, createForm.sucursal_origen, productos]);

  const handlePredictionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingPrediction(true);
    try {
      const response = await fetch("https://modeloprediccion-production.up.railway.app/predict_list", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...predictionForm, Date: format(predictionForm.Date, "yyyy-MM-dd") }),
      });
      if (!response.ok) throw new Error(`Error en la API: ${response.statusText}`);
      const data = await response.json();
      setPredictions(data.predictions);
      toast.success("Predicción generada con éxito.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo obtener la predicción.");
    } finally {
      setIsLoadingPrediction(false);
    }
  };

  const handleAddProductToVuelo = () => {
    if (!tempProduct.producto || !tempProduct.cantidad) return toast.error("Selecciona un producto y una cantidad.");
    const newProduct: CantidadEnVuelo = { producto: tempProduct.producto as Id<"Cantidad">, cantidad: Number(tempProduct.cantidad) };
    setCreateForm(prev => ({ ...prev, cantidad: [...prev.cantidad, newProduct] }));
    setTempProduct({ producto: "", cantidad: "" });
  };
  
  const handleRemoveProductFromVuelo = (index: number) => setCreateForm(prev => ({ ...prev, cantidad: prev.cantidad.filter((_, i) => i !== index) }));

  const handleCreateVuelo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createForm.cantidad.length === 0) return toast.error("Debes añadir al menos un producto al vuelo.");
    toast.promise(createVuelo({ ...createForm, carrito_id: createForm.carrito_id as Id<"Carrito">, sucursal_origen: createForm.sucursal_origen as Id<"Sucursal">, sucursal_destino: createForm.sucursal_destino as Id<"Sucursal"> }), {
      loading: "Iniciando traslado...", success: "¡Traslado iniciado con éxito!", error: (err) => `Error: ${err.message}`
    });
    setCreateDialogOpen(false);
    setCreateForm(initialCreateState);
    setPredictions(null);
    setShowPrediction(false);
  };
  
  const handleCompleteVuelo = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.promise(completeVuelo(completeForm), { loading: "Completando traslado...", success: "¡Traslado completado!", error: (err) => `Error: ${err.message}` });
    setCompleteDialogOpen(false);
  };

  const openCompleteDialog = (vuelo: VueloType) => {
    setSelectedVuelo(vuelo);
    setCompleteForm({ vueloId: vuelo._id, cantidad: vuelo.cantidad.map(item => ({ ...item, sobrante: item.cantidad })) });
    setCompleteDialogOpen(true);
  };

  const handleSobranteChange = (index: number, value: string) => {
    const newCantidad = [...completeForm.cantidad];
    const originalAmount = selectedVuelo?.cantidad[index]?.cantidad ?? 0;
    const newValue = Math.max(0, Math.min(Number(value), originalAmount));
    newCantidad[index] = { ...newCantidad[index], sobrante: newValue };
    setCompleteForm(prev => ({ ...prev, cantidad: newCantidad }));
  };

  if (!vuelos || !carritos || !sucursales || !inventario || !productos) {
    return <div className="p-4 sm:p-6">Cargando datos de traslados...</div>;
  }

  return (
    <div className="general-styles">
      <main>
      <Card style={chartContainerStyle}>
        <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <CardTitle>Administración de Traslados</CardTitle>
            <CardDescription>Inicia y completa los traslados de inventario entre sucursales.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar traslado..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto shrink-0">
              <PlusCircle className="mr-2 h-4 w-4" /> Iniciar Traslado
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Estado</TableHead><TableHead>Carrito</TableHead><TableHead>Origen</TableHead><TableHead>Destino</TableHead><TableHead>Fecha</TableHead><TableHead><span className="sr-only">Acciones</span></TableHead></TableRow></TableHeader>
              <TableBody>
                {paginatedVuelos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      {searchTerm ? "No se encontraron resultados." : "No hay traslados registrados."}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedVuelos.map(vuelo => (
                    <TableRow key={vuelo._id}>
                      <TableCell><Badge variant={vuelo.completado ? "default" : "secondary"}>{vuelo.completado ? "Completado" : "En Tránsito"}</Badge></TableCell>
                      <TableCell>{getNombre(vuelo.carrito_id, carritos)}</TableCell>
                      <TableCell>{getNombre(vuelo.sucursal_origen, sucursales)}</TableCell>
                      <TableCell>{getNombre(vuelo.sucursal_destino, sucursales)}</TableCell>
                      <TableCell>{formatDate(vuelo.fecha_registro)}</TableCell>
                      <TableCell>{!vuelo.completado && <DropdownMenu><DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Acciones</DropdownMenuLabel><DropdownMenuItem onClick={() => openCompleteDialog(vuelo)}>Completar Traslado</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}</TableCell>
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

      <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Iniciar Nuevo Traslado</DialogTitle>
            <DialogDescription>Prepara el inventario a enviar. Puedes usar la predicción como guía.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 py-4 overflow-hidden h-full">
            <form onSubmit={handleCreateVuelo} className="lg:col-span-3 flex flex-col h-full">
              <div className="flex-1 overflow-y-auto pr-4 space-y-4 min-h-0">
                <div><Label>Sucursal de Origen</Label><Combobox options={sucursales.map(s => ({ value: s._id, label: s.nombre }))} value={createForm.sucursal_origen} onChange={val => setCreateForm(p => ({ ...p, sucursal_origen: val }))} placeholder="Selecciona origen" searchPlaceholder="Buscar sucursal..." /></div>
                <div><Label>Sucursal de Destino</Label><Combobox options={sucursales.map(s => ({ value: s._id, label: s.nombre }))} value={createForm.sucursal_destino} onChange={val => setCreateForm(p => ({ ...p, sucursal_destino: val }))} placeholder="Selecciona destino" searchPlaceholder="Buscar sucursal..." /></div>
                <div><Label>Carrito Asignado</Label><Combobox options={carritos.map(c => ({ value: c._id, label: c.nombre }))} value={createForm.carrito_id} onChange={val => setCreateForm(p => ({ ...p, carrito_id: val }))} placeholder="Selecciona un carrito" searchPlaceholder="Buscar carrito..." /></div>
                <div className="border-t pt-4 min-h-24"><h4 className="font-semibold mb-2">Productos a Enviar</h4>{createForm.sucursal_origen ? (<div className="flex items-end gap-2"><div className="flex-1"><Label>Producto en Inventario</Label><Combobox options={inventarioEnOrigen} value={tempProduct.producto} onChange={val => setTempProduct(p => ({ ...p, producto: val }))} placeholder="Selecciona del stock" searchPlaceholder="Buscar producto..." /></div><div className="w-24"><Label>Cantidad</Label><Input type="number" value={tempProduct.cantidad} onChange={e => setTempProduct(p => ({ ...p, cantidad: e.target.value }))} placeholder="0" /></div><Button type="button" onClick={handleAddProductToVuelo}>Agregar</Button></div>) : <p className="text-sm text-muted-foreground">Selecciona origen para ver inventario.</p>}</div>
                <div className="min-h-[8rem] space-y-2 border rounded-md p-2">{createForm.cantidad.length === 0 ? <p className="text-xs text-center text-muted-foreground pt-4">Aún no has agregado productos.</p> : createForm.cantidad.map((item, index) => (<div key={index} className="flex items-center justify-between text-sm bg-muted p-2 rounded-md"><span>{getProductoNombreFromCantidadId(item.producto)} - <span className="font-bold">{item.cantidad}</span> uds.</span><Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveProductFromVuelo(index)}><Trash2 className="h-4 w-4" /></Button></div>))}</div>
              </div>
              <DialogFooter className="!justify-between pt-4 border-t mt-4"><DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose><Button type="submit">Iniciar Traslado</Button></DialogFooter>
            </form>
            <div className="lg:col-span-2 border-l lg:pl-6 flex flex-col h-full">{!showPrediction ? (<div className="flex flex-col items-center justify-center h-full text-center"><BrainCircuit className="h-12 w-12 text-muted-foreground mb-4"/><h3 className="font-semibold">¿Necesitas ayuda?</h3><p className="text-sm text-muted-foreground mb-4">Usa nuestro modelo de IA para predecir la demanda.</p><Button variant="outline" onClick={() => setShowPrediction(true)}>Obtener Predicción</Button></div>) : (<div className="flex flex-col h-full">{!predictions ? (<form onSubmit={handlePredictionSubmit} className="space-y-4"><h3 className="font-semibold">Parámetros de Predicción</h3><div className="space-y-2"><Label>Origen</Label><Input value={predictionForm.Origin} onChange={e => setPredictionForm(p => ({ ...p, Origin: e.target.value.toUpperCase() }))} placeholder="Ej: MTY" maxLength={3} /></div><div className="space-y-2"><Label>Fecha del Vuelo</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start font-normal", !predictionForm.Date && "text-muted-foreground")}>{predictionForm.Date ? format(predictionForm.Date, "PPP", { locale: es }) : <span>Elige fecha</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={predictionForm.Date} onSelect={(date) => date && setPredictionForm(p => ({ ...p, Date: date }))} initialFocus /></PopoverContent></Popover></div><div className="space-y-2"><Label>Tipo de Vuelo</Label><Select value={predictionForm.Flight_Type} onValueChange={(val: "medium-haul"|"long-haul") => setPredictionForm(p => ({ ...p, Flight_Type: val }))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="medium-haul">Mediano Alcance</SelectItem><SelectItem value="long-haul">Largo Alcance</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Pasajeros</Label><Input type="number" value={predictionForm.Passenger_Count} onChange={e => setPredictionForm(p => ({ ...p, Passenger_Count: Number(e.target.value) }))} /></div><Button type="submit" className="w-full" disabled={isLoadingPrediction}>{isLoadingPrediction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Generar</Button></form>) : (<div className="flex flex-col h-full"><div className="flex justify-between items-center mb-2"><h4 className="font-semibold">Resultados Sugeridos</h4><Button variant="outline" size="sm" onClick={() => setPredictions(null)}><ArrowLeft className="h-4 w-4 mr-2"/>Volver</Button></div><div className="flex-1 overflow-y-auto pr-2 space-y-2">{Object.entries(predictions).map(([prod, qty]) => <li key={prod} className="flex justify-between items-center bg-muted p-2 rounded-md text-sm list-none"><span>{prod}</span><span className="font-bold">{qty}</span></li>)}</div></div>)}</div>)}</div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isCompleteDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCompleteVuelo}>
            <DialogHeader>
              <DialogTitle>Completar Traslado</DialogTitle>
              <DialogDescription>
                Confirma la cantidad de cada producto que llegó a destino. El resto se marcará como sobrante.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {completeForm.cantidad.map((item, index) => (
                <div key={item.producto} className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor={`sobrante-${index}`} className="col-span-2">
                    {getProductoNombreFromCantidadId(item.producto)} (Enviados: {selectedVuelo?.cantidad[index].cantidad})
                  </Label>
                  <Input
                    id={`sobrante-${index}`}
                    type="number"
                    value={item.sobrante}
                    onChange={(e) => handleSobranteChange(index, e.target.value)}
                    className="col-span-1"
                    max={selectedVuelo?.cantidad[index].cantidad}
                    min={0}
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancelar</Button>
              </DialogClose>
              <Button type="submit">Completar Traslado</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </main>
    </div>
  );
}