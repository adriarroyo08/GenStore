import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFormValidation, ValidationSchema, FormValues } from '../../hooks/useFormValidation'

const patientSchema: ValidationSchema = {
  nombre: [{ type: 'required' }, { type: 'minLength', min: 2 }],
  email: [{ type: 'required' }, { type: 'email' }],
  telefono: [{ type: 'phone' }],
  precio: [{ type: 'positiveNumber' }],
}

const initialValues: FormValues = {
  nombre: '',
  email: '',
  telefono: '',
  precio: '',
}

describe('useFormValidation', () => {
  describe('estado inicial', () => {
    it('inicia con los valores proporcionados', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialValues, patientSchema)
      )
      expect(result.current.values).toEqual(initialValues)
    })

    it('inicia sin errores', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialValues, patientSchema)
      )
      expect(result.current.errors).toEqual({})
    })

    it('inicia con isDirty en false', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialValues, patientSchema)
      )
      expect(result.current.isDirty).toBe(false)
    })

    it('isValid es false cuando valores iniciales son inválidos', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialValues, patientSchema)
      )
      // nombre vacío falla 'required'
      expect(result.current.isValid).toBe(false)
    })

    it('isValid es true cuando valores iniciales son válidos', () => {
      const validInitial: FormValues = {
        nombre: 'María',
        email: 'maria@example.com',
        telefono: '612345678',
        precio: '50',
      }
      const { result } = renderHook(() =>
        useFormValidation(validInitial, patientSchema)
      )
      expect(result.current.isValid).toBe(true)
    })
  })

  describe('setValue', () => {
    it('actualiza el valor del campo', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialValues, patientSchema)
      )

      act(() => {
        result.current.setValue('nombre', 'Carlos')
      })

      expect(result.current.values.nombre).toBe('Carlos')
    })

    it('establece isDirty a true al modificar un campo', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialValues, patientSchema)
      )

      act(() => {
        result.current.setValue('nombre', 'Test')
      })

      expect(result.current.isDirty).toBe(true)
    })

    it('valida el campo en tiempo real al cambiar el valor', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialValues, patientSchema)
      )

      act(() => {
        result.current.setValue('email', 'email-invalido')
      })

      expect(result.current.errors.email).toBe('El email no es válido')
    })

    it('limpia el error cuando el valor se corrige', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialValues, patientSchema)
      )

      act(() => {
        result.current.setValue('email', 'email-invalido')
      })
      expect(result.current.errors.email).not.toBeNull()

      act(() => {
        result.current.setValue('email', 'valido@example.com')
      })
      expect(result.current.errors.email).toBeNull()
    })

    it('valida minLength correctamente', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialValues, patientSchema)
      )

      act(() => {
        result.current.setValue('nombre', 'A') // menos de 2 caracteres
      })

      expect(result.current.errors.nombre).toBe('Mínimo 2 caracteres')
    })

    it('valida teléfono español', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialValues, patientSchema)
      )

      act(() => {
        result.current.setValue('telefono', '123')
      })

      expect(result.current.errors.telefono).toBe('El teléfono no es válido')
    })

    it('valida número positivo', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialValues, patientSchema)
      )

      act(() => {
        result.current.setValue('precio', '-10')
      })

      expect(result.current.errors.precio).toBe('Debe ser un número positivo')
    })
  })

  describe('validateAllFields', () => {
    it('retorna false cuando hay campos inválidos', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialValues, patientSchema)
      )

      let isValid: boolean
      act(() => {
        isValid = result.current.validateAllFields()
      })

      expect(isValid!).toBe(false)
    })

    it('establece errores para todos los campos inválidos', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialValues, patientSchema)
      )

      act(() => {
        result.current.validateAllFields()
      })

      expect(result.current.errors.nombre).toBeTruthy()
      expect(result.current.errors.email).toBeTruthy()
    })

    it('retorna true cuando todos los campos son válidos', () => {
      const validValues: FormValues = {
        nombre: 'María González',
        email: 'maria@example.com',
        telefono: '612345678',
        precio: '50',
      }
      const { result } = renderHook(() =>
        useFormValidation(validValues, patientSchema)
      )

      let isValid: boolean
      act(() => {
        isValid = result.current.validateAllFields()
      })

      expect(isValid!).toBe(true)
    })

    it('no establece errores cuando todos son válidos', () => {
      const validValues: FormValues = {
        nombre: 'Pedro',
        email: 'pedro@example.com',
        telefono: '698765432',
        precio: '45',
      }
      const { result } = renderHook(() =>
        useFormValidation(validValues, patientSchema)
      )

      act(() => {
        result.current.validateAllFields()
      })

      Object.values(result.current.errors).forEach(err => {
        expect(err).toBeNull()
      })
    })
  })

  describe('validateSingleField', () => {
    it('valida un campo individual y retorna el error', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialValues, patientSchema)
      )

      let error: string | null
      act(() => {
        error = result.current.validateSingleField('email')
      })

      expect(error!).toBe('Este campo es requerido')
    })

    it('retorna null cuando el campo es válido', () => {
      const validValues: FormValues = { ...initialValues, email: 'test@example.com' }
      const { result } = renderHook(() =>
        useFormValidation(validValues, patientSchema)
      )

      let error: string | null
      act(() => {
        error = result.current.validateSingleField('email')
      })

      expect(error!).toBeNull()
    })

    it('actualiza el estado de errors al validar un campo', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialValues, patientSchema)
      )

      act(() => {
        result.current.validateSingleField('nombre')
      })

      expect(result.current.errors.nombre).toBe('Este campo es requerido')
    })
  })

  describe('resetForm', () => {
    it('restaura los valores iniciales', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialValues, patientSchema)
      )

      act(() => {
        result.current.setValue('nombre', 'Alguien')
      })

      act(() => {
        result.current.resetForm()
      })

      expect(result.current.values.nombre).toBe('')
    })

    it('limpia todos los errores', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialValues, patientSchema)
      )

      act(() => {
        result.current.validateAllFields()
      })

      act(() => {
        result.current.resetForm()
      })

      expect(result.current.errors).toEqual({})
    })

    it('resetea isDirty a false', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialValues, patientSchema)
      )

      act(() => {
        result.current.setValue('nombre', 'Test')
      })
      expect(result.current.isDirty).toBe(true)

      act(() => {
        result.current.resetForm()
      })

      expect(result.current.isDirty).toBe(false)
    })
  })

  describe('resetErrors', () => {
    it('limpia los errores sin resetear los valores', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialValues, patientSchema)
      )

      act(() => {
        result.current.setValue('nombre', 'Test')
        result.current.validateAllFields()
      })

      act(() => {
        result.current.resetErrors()
      })

      expect(result.current.errors).toEqual({})
      expect(result.current.values.nombre).toBe('Test')
    })
  })

  describe('setValues', () => {
    it('establece múltiples valores a la vez', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialValues, patientSchema)
      )

      const newValues: FormValues = {
        nombre: 'Juan',
        email: 'juan@example.com',
        telefono: '612345678',
        precio: '60',
      }

      act(() => {
        result.current.setValues(newValues)
      })

      expect(result.current.values).toEqual(newValues)
      expect(result.current.isDirty).toBe(true)
    })
  })

  describe('validación de reglas personalizadas', () => {
    it('aplica validador custom correctamente', () => {
      const customSchema: ValidationSchema = {
        codigoPostal: [
          {
            type: 'custom',
            validator: (v) => /^\d{5}$/.test(v),
            message: 'El código postal debe tener 5 dígitos',
          },
        ],
      }

      const { result } = renderHook(() =>
        useFormValidation({ codigoPostal: '' }, customSchema)
      )

      act(() => {
        result.current.setValue('codigoPostal', '123')
      })

      expect(result.current.errors.codigoPostal).toBe(
        'El código postal debe tener 5 dígitos'
      )
    })

    it('no hay error cuando el validador custom pasa', () => {
      const customSchema: ValidationSchema = {
        codigoPostal: [
          {
            type: 'custom',
            validator: (v) => /^\d{5}$/.test(v),
            message: 'El código postal debe tener 5 dígitos',
          },
        ],
      }

      const { result } = renderHook(() =>
        useFormValidation({ codigoPostal: '' }, customSchema)
      )

      act(() => {
        result.current.setValue('codigoPostal', '28001')
      })

      expect(result.current.errors.codigoPostal).toBeNull()
    })
  })

  describe('validación de fecha futura', () => {
    it('rechaza fecha en el pasado', () => {
      const schema: ValidationSchema = {
        fechaCita: [{ type: 'futureDate' }],
      }

      const { result } = renderHook(() =>
        useFormValidation({ fechaCita: '' }, schema)
      )

      act(() => {
        result.current.setValue('fechaCita', '2020-01-01')
      })

      expect(result.current.errors.fechaCita).toBe('La fecha no puede ser en el pasado')
    })

    it('acepta fecha futura', () => {
      const schema: ValidationSchema = {
        fechaCita: [{ type: 'futureDate' }],
      }

      const { result } = renderHook(() =>
        useFormValidation({ fechaCita: '' }, schema)
      )

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)

      act(() => {
        result.current.setValue('fechaCita', futureDate.toISOString())
      })

      expect(result.current.errors.fechaCita).toBeNull()
    })
  })

  describe('isValid calculado en tiempo real', () => {
    it('isValid se actualiza cuando se corrigen los campos', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialValues, patientSchema)
      )

      expect(result.current.isValid).toBe(false)

      act(() => {
        result.current.setValue('nombre', 'María González')
        result.current.setValue('email', 'maria@example.com')
        result.current.setValue('telefono', '612345678')
        result.current.setValue('precio', '50')
      })

      expect(result.current.isValid).toBe(true)
    })
  })
})
