"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";

// --- Importaciones de Componentes Shadcn/ui ---
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface QuestionFormProps {
  onComplete?: (answers: {
    origin: string;
    destination: string;
    passengers: number;
    date: Date;
    flightType: string;
  }) => void;
}

export function QuestionForm({ onComplete }: QuestionFormProps) {
  // Router para navegación
  const router = useRouter();
  
  // Estados del formulario
  const [currentStep, setCurrentStep] = useState(0);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [passengers, setPassengers] = useState("");
  const [date, setDate] = useState<Date>();
  const [flightType, setFlightType] = useState<"medium-haul" | "long-haul">("medium-haul");
  
  // Estados de predicción
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [predictions, setPredictions] = useState<Record<string, number> | null>(null);
  
  // Estado para el diálogo de creación de vuelo
  const [showFlightDialog, setShowFlightDialog] = useState(false);
  
  // Queries de Convex
  const sucursales = useQuery(api.Sucursal.getSucursales);
  const carritos = useQuery(api.Carrito.getCarritos);
  const inventario = useQuery(api.Cantidad.getCantidades);
  const productos = useQuery(api.Producto.getProductos);

  // Mutación para crear vuelo
  const createVuelo = useMutation(api.Vuelo.createVuelo);

  // Datos para el diálogo de vuelo
  const [flightForm, setFlightForm] = useState({
    carrito_id: "",
    sucursal_origen: "",
    sucursal_destino: "",
    cantidad: [] as Array<{ producto: Id<"Cantidad">; cantidad: number }>,
  });

  // Estado temporal para agregar productos
  const [tempProduct, setTempProduct] = useState({ producto: "", cantidad: "" });

  // Filtrar inventario por sucursal origen
  const inventarioOrigen = inventario?.filter(
    (item) => item.sucursal_id === flightForm.sucursal_origen
  ) || [];

  // Función para agregar producto
  const handleAddProduct = () => {
    if (!tempProduct.producto || !tempProduct.cantidad) {
      toast.error("Selecciona un producto y especifica la cantidad");
      return;
    }

    const cantidad = parseInt(tempProduct.cantidad);
    const inventarioItem = inventario?.find(
      (item) => item._id === tempProduct.producto
    );

    if (!inventarioItem) {
      toast.error("Producto no encontrado en inventario");
      return;
    }

    if (cantidad > inventarioItem.cantidad) {
      toast.error(`Stock insuficiente. Disponible: ${inventarioItem.cantidad}`);
      return;
    }

    if (cantidad <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    // Verificar si el producto ya está agregado
    const existingIndex = flightForm.cantidad.findIndex(
      (item) => item.producto === tempProduct.producto
    );

    if (existingIndex >= 0) {
      // Actualizar cantidad existente
      const newCantidad = [...flightForm.cantidad];
      newCantidad[existingIndex].cantidad += cantidad;
      setFlightForm((prev) => ({ ...prev, cantidad: newCantidad }));
      toast.success("Cantidad actualizada");
    } else {
      // Agregar nuevo producto
      setFlightForm((prev) => ({
        ...prev,
        cantidad: [
          ...prev.cantidad,
          { producto: tempProduct.producto as Id<"Cantidad">, cantidad },
        ],
      }));
      toast.success("Producto agregado");
    }

    setTempProduct({ producto: "", cantidad: "" });
  };

  // Función para remover producto
  const handleRemoveProduct = (productoId: string) => {
    setFlightForm((prev) => ({
      ...prev,
      cantidad: prev.cantidad.filter((item) => item.producto !== productoId),
    }));
    toast.success("Producto removido");
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      // Desde paso inicial, siempre ir a paso 1 (origen)
      setCurrentStep(1);
    } else if (currentStep === 1 && origin) {
      setCurrentStep(2);
    } else if (currentStep === 2 && destination) {
      setCurrentStep(3);
    } else if (currentStep === 3 && passengers && date) {
      // Generar predicción
      await generatePrediction();
      setCurrentStep(4);
    }
  };

  const generatePrediction = async () => {
    if (!date || !passengers) return;
    
    setIsLoadingPrediction(true);
    try {
      const response = await fetch("https://modeloprediccion-production.up.railway.app/predict_list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Origin: origin,
          Date: format(date, "yyyy-MM-dd"),
          Flight_Type: flightType,
          Passenger_Count: Number(passengers),
        }),
      });
      
      if (!response.ok) throw new Error(`Error en la API: ${response.statusText}`);
      
      const data = await response.json();
      setPredictions(data.predictions);
      toast.success("Predicción generada con éxito.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo obtener la predicción.");
      setPredictions(null);
    } finally {
      setIsLoadingPrediction(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (predictions && date) {
      // Prellenar el formulario de vuelo
      setFlightForm(prev => ({
        ...prev,
        sucursal_origen: origin,
        sucursal_destino: destination,
      }));
      
      // Mostrar el diálogo de vuelo
      setShowFlightDialog(true);
      
      // Llamar callback si existe
      onComplete?.({
        origin,
        destination,
        passengers: Number(passengers),
        date,
        flightType,
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGoToDashboard = () => {
    // Navegar a la raíz con hash para hacer scroll automático (id="Graficas")
    router.push('/#Graficas');
  };

  const handleCreateFlight = async () => {
    if (!flightForm.carrito_id || !flightForm.sucursal_origen || !flightForm.sucursal_destino || flightForm.cantidad.length === 0) {
      toast.error("Por favor completa todos los campos del vuelo.");
      return;
    }

    try {
      await createVuelo({
        carrito_id: flightForm.carrito_id as Id<"Carrito">,
        sucursal_origen: flightForm.sucursal_origen as Id<"Sucursal">,
        sucursal_destino: flightForm.sucursal_destino as Id<"Sucursal">,
        cantidad: flightForm.cantidad,
      });
      
      toast.success("¡Vuelo creado exitosamente!");
      setShowFlightDialog(false);
      
      // Resetear el formulario
      setCurrentStep(0);
      setOrigin("");
      setDestination("");
      setPassengers("");
      setDate(undefined);
      setPredictions(null);
      setFlightForm({
        carrito_id: "",
        sucursal_origen: "",
        sucursal_destino: "",
        cantidad: [],
      });

      // Redirigir a la página de vuelos
      setTimeout(() => {
        router.push('/flight');
      }, 1000); // Dar tiempo para ver el toast de éxito
    } catch {
      toast.error("Error al crear el vuelo");
    }
  };

  if (!sucursales || !carritos || !inventario || !productos) {
    return <div className="p-4">Cargando...</div>;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Información del Vuelo</FieldLegend>
            <FieldDescription>
              {currentStep === 0 ? "Inicio" : `Paso ${currentStep} de 4`}
            </FieldDescription>
            <FieldGroup>
              {/* Paso 0: Pantalla Inicial */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <FieldLabel className="text-xl font-semibold">
                      ¿Cómo vamos a comenzar hoy?
                    </FieldLabel>
                    <FieldDescription className="mt-2">
                      Selecciona una opción para continuar
                    </FieldDescription>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="h-auto py-4 text-base"
                      size="lg"
                    >
                      ✈️ Registrar un Vuelo
                    </Button>
                    
                    <Button
                      type="button"
                      onClick={handleGoToDashboard}
                      variant="outline"
                      className="h-auto py-4 text-base"
                      size="lg"
                    >
                      📊 Ver Estadísticas
                    </Button>
                  </div>
                </div>
              )}

              {/* Paso 1: Sucursal de Origen */}
              {currentStep === 1 && (
                <Field>
                  <FieldLabel htmlFor="origin">
                    1. Selecciona la sucursal de origen
                  </FieldLabel>
                  <Combobox
                    options={sucursales.map(s => ({ value: s._id, label: s.nombre }))}
                    value={origin}
                    onChange={setOrigin}
                    placeholder="Selecciona una sucursal"
                    searchPlaceholder="Buscar sucursal..."
                  />
                </Field>
              )}

              {/* Paso 2: Sucursal de Destino */}
              {currentStep === 2 && (
                <Field>
                  <FieldLabel htmlFor="destination">
                    2. Selecciona la sucursal de destino
                  </FieldLabel>
                  <Combobox
                    options={sucursales.filter(s => s._id !== origin).map(s => ({ value: s._id, label: s.nombre }))}
                    value={destination}
                    onChange={setDestination}
                    placeholder="Selecciona una sucursal"
                    searchPlaceholder="Buscar sucursal..."
                  />
                </Field>
              )}

              {/* Paso 3: Fecha y Pasajeros */}
              {currentStep === 3 && (
                <>
                  <Field>
                    <FieldLabel htmlFor="date">
                      3. Selecciona la fecha del vuelo
                    </FieldLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP", { locale: es }) : "Selecciona una fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="passengers">
                      Número de pasajeros
                    </FieldLabel>
                    <Input
                      id="passengers"
                      type="number"
                      min="1"
                      max="350"
                      placeholder="Ej: 150"
                      value={passengers}
                      onChange={(e) => setPassengers(e.target.value)}
                      required
                    />
                    <FieldDescription>
                      Ingresa el número total de pasajeros (1-350)
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="flightType">
                      Tipo de vuelo
                    </FieldLabel>
                    <Select value={flightType} onValueChange={(value: "medium-haul" | "long-haul") => setFlightType(value)}>
                      <SelectTrigger id="flightType">
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="medium-haul">Mediano Alcance</SelectItem>
                        <SelectItem value="long-haul">Largo Alcance</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </>
              )}

              {/* Paso 4: Mostrar Predicción */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="text-center">
                    {isLoadingPrediction ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                        <p className="text-sm text-gray-600">Generando predicción...</p>
                      </div>
                    ) : predictions ? (
                      <>
                        <h3 className="text-lg font-semibold mb-4">Predicción de Productos</h3>
                        <div className="max-h-64 overflow-y-auto space-y-2">
                          {Object.entries(predictions).slice(0, 10).map(([product, quantity]) => (
                            <div key={product} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm font-medium">{product}</span>
                              <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded">{quantity} unidades</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-4">
                          Mostrando top 10 productos predichos
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-red-600">No se pudo generar la predicción</p>
                    )}
                  </div>
                </div>
              )}
            </FieldGroup>
          </FieldSet>

          <Field orientation="horizontal">
            {currentStep > 1 && currentStep < 4 && (
              <Button variant="outline" type="button" onClick={handleBack}>
                Atrás
              </Button>
            )}
            {currentStep === 0 ? (
              // En el paso 0 no mostramos botones de navegación (solo los del contenido)
              null
            ) : currentStep < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !origin) ||
                  (currentStep === 2 && !destination)
                }
              >
                Siguiente
              </Button>
            ) : currentStep === 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!passengers || !date}
              >
                Generar Predicción
              </Button>
            ) : (
              <Button type="submit" disabled={!predictions}>
                Crear Vuelo
              </Button>
            )}
          </Field>
        </FieldGroup>
      </form>

      {/* Diálogo para crear vuelo con datos precargados */}
      <Dialog open={showFlightDialog} onOpenChange={setShowFlightDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Vuelo</DialogTitle>
            <DialogDescription>
              Información del vuelo prellenada con los datos de la predicción
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Tipo de Carrito</Label>
              <Combobox
                options={carritos.map(c => ({ value: c._id, label: `${c.nombre} (${c.tipo})` }))}
                value={flightForm.carrito_id}
                onChange={(val) => setFlightForm(prev => ({ ...prev, carrito_id: val }))}
                placeholder="Selecciona un carrito"
                searchPlaceholder="Buscar carrito..."
              />
            </div>

            <div>
              <Label>Origen (Prellenado)</Label>
              <Input value={sucursales.find(s => s._id === origin)?.nombre || ""} disabled />
            </div>

            <div>
              <Label>Destino (Prellenado)</Label>
              <Input value={sucursales.find(s => s._id === destination)?.nombre || ""} disabled />
            </div>

            <div className="border-t pt-4">
              <Label className="text-lg font-semibold mb-4 block">Gestión de Productos</Label>
              
              {/* Agregar productos */}
              <div className="space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="select-product">Seleccionar Producto</Label>
                    <Combobox
                      options={inventarioOrigen.map((inv) => {
                        const producto = productos?.find((p) => p._id === inv.producto_id);
                        return {
                          value: inv._id,
                          label: `${producto?.nombre || "Desconocido"} (Stock: ${inv.cantidad})`,
                        };
                      })}
                      value={tempProduct.producto}
                      onChange={(val) => setTempProduct((prev) => ({ ...prev, producto: val }))}
                      placeholder="Selecciona un producto"
                      searchPlaceholder="Buscar producto..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="product-quantity">Cantidad</Label>
                    <div className="flex gap-2">
                      <Input
                        id="product-quantity"
                        type="number"
                        min="1"
                        placeholder="Cantidad"
                        value={tempProduct.cantidad}
                        onChange={(e) => setTempProduct((prev) => ({ ...prev, cantidad: e.target.value }))}
                      />
                      <Button type="button" onClick={handleAddProduct} className="whitespace-nowrap">
                        Agregar
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Productos sugeridos de la predicción */}
                {predictions && (
                  <div className="bg-purple-50 border border-purple-200 rounded p-3">
                    <p className="text-sm font-medium text-purple-900 mb-2">
                      💡 Sugerencias basadas en predicción ({passengers} pasajeros):
                    </p>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {Object.entries(predictions).slice(0, 6).map(([product, quantity]) => (
                        <div key={product} className="flex justify-between text-purple-700">
                          <span>{product}</span>
                          <span className="font-semibold">{quantity} und.</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Lista de productos agregados */}
              <div>
                <Label className="mb-2 block">Productos Agregados ({flightForm.cantidad.length})</Label>
                {flightForm.cantidad.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-4 border rounded bg-gray-50">
                    No hay productos agregados. Agrega al menos uno para crear el vuelo.
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto border rounded divide-y">
                    {flightForm.cantidad.map((item) => {
                      const inventarioItem = inventario?.find((inv) => inv._id === item.producto);
                      const producto = productos?.find((p) => p._id === inventarioItem?.producto_id);
                      
                      return (
                        <div key={item.producto} className="flex items-center justify-between p-3 hover:bg-gray-50">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{producto?.nombre || "Desconocido"}</p>
                            <p className="text-xs text-gray-500">
                              Cantidad: {item.cantidad} | Stock disponible: {inventarioItem?.cantidad || 0}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveProduct(item.producto)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Remover
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end border-t pt-4">
              <Button variant="outline" onClick={() => setShowFlightDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateFlight}
                disabled={flightForm.cantidad.length === 0 || !flightForm.carrito_id}
              >
                Crear Vuelo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}