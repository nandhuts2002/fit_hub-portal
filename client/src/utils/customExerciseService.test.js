import customExerciseService from './customExerciseService';

// Mock fetch globally
global.fetch = jest.fn();

describe('CustomExerciseService', () => {
  let service;
  const mockApiBase = 'http://localhost:5000';
  let consoleSpy;
  let consoleLogSpy;

  beforeEach(() => {
    // Use the singleton instance
    service = customExerciseService;
    service.apiBase = mockApiBase;
    
    // Clear all mocks
    fetch.mockClear();
    
    // Clear console mocks
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods
    if (consoleSpy) {
      consoleSpy.mockRestore();
    }
    if (consoleLogSpy) {
      consoleLogSpy.mockRestore();
    }
  });

  describe('Service Instance', () => {
    it('should have apiBase property', () => {
      expect(service.apiBase).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(typeof service.getPinterestGifs).toBe('function');
      expect(typeof service.getCustomExercises).toBe('function');
      expect(typeof service.searchCustomExercises).toBe('function');
      expect(typeof service.getCustomExercisesByBodyPart).toBe('function');
      expect(typeof service.addTrainerExercise).toBe('function');
      expect(typeof service.uploadExerciseGif).toBe('function');
      expect(typeof service.deleteTrainerExercise).toBe('function');
      expect(typeof service.getCombinedExercises).toBe('function');
    });
  });

  describe('getPinterestGifs', () => {
    it('should return empty object', () => {
      const result = service.getPinterestGifs();
      expect(result).toEqual({});
    });
  });

  describe('getCustomExercises', () => {
    it('should fetch exercises from API successfully', async () => {
      const mockExercises = [
        { id: 1, name: 'Push Up', bodyPart: 'chest' },
        { id: 2, name: 'Squat', bodyPart: 'legs' }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockExercises)
      });

      const result = await service.getCustomExercises();

      expect(fetch).toHaveBeenCalledWith(`${mockApiBase}/api/custom-exercises`);
      expect(result).toEqual(mockExercises);
    });

    it('should fallback to Pinterest GIFs on API error', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.getCustomExercises();

      expect(console.log).toHaveBeenCalledWith('Custom exercises API not available, using local data');
      expect(result).toEqual([]);
    });

    it('should fallback to Pinterest GIFs on non-ok response', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const result = await service.getCustomExercises();

      // The service doesn't log on non-ok response, only on catch
      expect(result).toEqual([]);
    });
  });

  describe('searchCustomExercises', () => {
    it('should filter exercises by name', async () => {
      const mockExercises = [
        { name: 'Push Up', bodyPart: 'chest', target: 'pectorals', equipment: 'body weight' },
        { name: 'Pull Up', bodyPart: 'back', target: 'lats', equipment: 'pull-up bar' },
        { name: 'Squat', bodyPart: 'legs', target: 'quadriceps', equipment: 'body weight' }
      ];

      jest.spyOn(service, 'getCustomExercises').mockResolvedValueOnce(mockExercises);

      const result = await service.searchCustomExercises('push');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Push Up');
    });

    it('should filter exercises by body part', async () => {
      const mockExercises = [
        { name: 'Push Up', bodyPart: 'chest', target: 'pectorals', equipment: 'body weight' },
        { name: 'Bench Press', bodyPart: 'chest', target: 'pectorals', equipment: 'barbell' }
      ];

      jest.spyOn(service, 'getCustomExercises').mockResolvedValueOnce(mockExercises);

      const result = await service.searchCustomExercises('chest');

      expect(result).toHaveLength(2);
    });

    it('should return empty array for no matches', async () => {
      const mockExercises = [
        { name: 'Push Up', bodyPart: 'chest', target: 'pectorals', equipment: 'body weight' }
      ];

      jest.spyOn(service, 'getCustomExercises').mockResolvedValueOnce(mockExercises);

      const result = await service.searchCustomExercises('nonexistent');

      expect(result).toHaveLength(0);
    });
  });

  describe('getCustomExercisesByBodyPart', () => {
    it('should filter exercises by body part', async () => {
      const mockExercises = [
        { name: 'Push Up', bodyPart: 'chest' },
        { name: 'Squat', bodyPart: 'legs' },
        { name: 'Bench Press', bodyPart: 'chest' }
      ];

      jest.spyOn(service, 'getCustomExercises').mockResolvedValueOnce(mockExercises);

      const result = await service.getCustomExercisesByBodyPart('chest');

      expect(result).toHaveLength(2);
      expect(result.every(ex => ex.bodyPart === 'chest')).toBe(true);
    });

    it('should be case insensitive', async () => {
      const mockExercises = [
        { name: 'Push Up', bodyPart: 'Chest' }
      ];

      jest.spyOn(service, 'getCustomExercises').mockResolvedValueOnce(mockExercises);

      const result = await service.getCustomExercisesByBodyPart('chest');

      expect(result).toHaveLength(1);
    });
  });

  describe('addTrainerExercise', () => {
    const mockExerciseData = {
      name: 'Test Exercise',
      bodyPart: 'chest',
      target: 'pectorals',
      equipment: 'body weight',
      instructions: ['Step 1', 'Step 2'],
      trainerId: 'trainer123'
    };

    it('should add exercise successfully', async () => {
      const mockResponse = { id: 1, ...mockExerciseData };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse)
      });

      const result = await service.addTrainerExercise(mockExerciseData);

      expect(fetch).toHaveBeenCalledWith(
        `${mockApiBase}/api/custom-exercises`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockExerciseData)
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle server error response with JSON error', async () => {
      const errorResponse = { error: 'Exercise name already exists' };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValueOnce(errorResponse)
      });

      await expect(service.addTrainerExercise(mockExerciseData))
        .rejects
        .toThrow('Exercise name already exists');

      expect(console.error).toHaveBeenCalledWith(
        'Error adding trainer exercise:', 
        expect.any(Error)
      );
    });

    it('should handle server error response with message field', async () => {
      const errorResponse = { message: 'Invalid exercise data' };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: jest.fn().mockResolvedValueOnce(errorResponse)
      });

      await expect(service.addTrainerExercise(mockExerciseData))
        .rejects
        .toThrow('Invalid exercise data');
    });

    it('should handle server error with status code when no error message', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValueOnce({})
      });

      await expect(service.addTrainerExercise(mockExerciseData))
        .rejects
        .toThrow('Failed to add exercise (status 500)');
    });

    it('should handle server error with text response', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockRejectedValueOnce(new Error('Not JSON')),
        text: jest.fn().mockResolvedValueOnce('Bad Request')
      });

      await expect(service.addTrainerExercise(mockExerciseData))
        .rejects
        .toThrow('Failed to add exercise: Bad Request');
    });

    it('should handle network error', async () => {
      const networkError = new Error('Network failure');
      fetch.mockRejectedValueOnce(networkError);

      await expect(service.addTrainerExercise(mockExerciseData))
        .rejects
        .toThrow('Network failure');

      expect(console.error).toHaveBeenCalledWith(
        'Error adding trainer exercise:', 
        networkError
      );
    });

    it('should set error status property', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: jest.fn().mockResolvedValueOnce({ error: 'Forbidden' })
      });

      try {
        await service.addTrainerExercise(mockExerciseData);
      } catch (error) {
        expect(error.status).toBe(403);
        expect(error.message).toBe('Forbidden');
      }
    });
  });

  describe('uploadExerciseGif', () => {
    it('should upload GIF successfully', async () => {
      const mockFile = new File(['gif content'], 'exercise.gif', { type: 'image/gif' });
      const exerciseId = '123';
      const mockResponse = { url: '/uploads/exercise-123.gif' };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse)
      });

      const result = await service.uploadExerciseGif(mockFile, exerciseId);

      expect(fetch).toHaveBeenCalledWith(
        `${mockApiBase}/api/upload-exercise-gif`,
        {
          method: 'POST',
          body: expect.any(FormData)
        }
      );

      // Check FormData contents
      const formData = fetch.mock.calls[0][1].body;
      expect(formData.get('gif')).toBe(mockFile);
      expect(formData.get('exerciseId')).toBe(exerciseId);

      expect(result).toEqual(mockResponse);
    });

    it('should handle upload error', async () => {
      const mockFile = new File(['gif content'], 'exercise.gif', { type: 'image/gif' });

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      await expect(service.uploadExerciseGif(mockFile, '123'))
        .rejects
        .toThrow('Failed to upload GIF');

      expect(console.error).toHaveBeenCalledWith(
        'Error uploading exercise GIF:', 
        expect.any(Error)
      );
    });

    it('should handle network error during upload', async () => {
      const mockFile = new File(['gif content'], 'exercise.gif', { type: 'image/gif' });
      const networkError = new Error('Network failure');

      fetch.mockRejectedValueOnce(networkError);

      await expect(service.uploadExerciseGif(mockFile, '123'))
        .rejects
        .toThrow('Network failure');

      expect(console.error).toHaveBeenCalledWith(
        'Error uploading exercise GIF:', 
        networkError
      );
    });
  });

  describe('deleteTrainerExercise', () => {
    it('should delete exercise successfully', async () => {
      const exerciseId = '123';
      const mockResponse = { message: 'Exercise deleted successfully' };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse)
      });

      const result = await service.deleteTrainerExercise(exerciseId);

      expect(fetch).toHaveBeenCalledWith(
        `${mockApiBase}/api/custom-exercises/${exerciseId}`,
        { method: 'DELETE' }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle delete error with error message', async () => {
      const exerciseId = '123';
      const errorResponse = { error: 'Exercise not found' };

      fetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValueOnce(errorResponse)
      });

      await expect(service.deleteTrainerExercise(exerciseId))
        .rejects
        .toThrow('Exercise not found');

      expect(console.error).toHaveBeenCalledWith(
        'Error deleting trainer exercise:', 
        expect.any(Error)
      );
    });

    it('should handle delete error with generic message', async () => {
      const exerciseId = '123';

      fetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValueOnce({})
      });

      await expect(service.deleteTrainerExercise(exerciseId))
        .rejects
        .toThrow('Failed to delete exercise');
    });

    it('should handle network error during deletion', async () => {
      const networkError = new Error('Network failure');
      fetch.mockRejectedValueOnce(networkError);

      await expect(service.deleteTrainerExercise('123'))
        .rejects
        .toThrow('Network failure');

      expect(console.error).toHaveBeenCalledWith(
        'Error deleting trainer exercise:', 
        networkError
      );
    });
  });

  describe('getCombinedExercises', () => {
    const mockExercises = [
      { name: 'Push Up', bodyPart: 'chest', target: 'pectorals', equipment: 'body weight' },
      { name: 'Squat', bodyPart: 'legs', target: 'quadriceps', equipment: 'body weight' },
      { name: 'Pull Up', bodyPart: 'back', target: 'lats', equipment: 'pull-up bar' }
    ];

    beforeEach(() => {
      jest.spyOn(service, 'getCustomExercises').mockResolvedValueOnce(mockExercises);
    });

    it('should return all exercises with default parameters', async () => {
      const result = await service.getCombinedExercises();

      expect(result).toEqual(mockExercises);
    });

    it('should filter exercises by query', async () => {
      jest.spyOn(service, 'searchCustomExercises').mockResolvedValueOnce([mockExercises[0]]);

      const result = await service.getCombinedExercises('push');

      expect(service.searchCustomExercises).toHaveBeenCalledWith('push');
      expect(result).toEqual([mockExercises[0]]);
    });

    it('should filter exercises by body part', async () => {
      const chestExercises = [mockExercises[0]];
      jest.spyOn(service, 'getCustomExercisesByBodyPart').mockResolvedValueOnce(chestExercises);

      const result = await service.getCombinedExercises('', 'chest');

      expect(service.getCustomExercisesByBodyPart).toHaveBeenCalledWith('chest');
      expect(result).toEqual(chestExercises);
    });

    it('should prioritize query over body part filter', async () => {
      jest.spyOn(service, 'searchCustomExercises').mockResolvedValueOnce([mockExercises[2]]);

      const result = await service.getCombinedExercises('pull', 'chest');

      expect(service.searchCustomExercises).toHaveBeenCalledWith('pull');
      expect(service.getCustomExercisesByBodyPart).not.toHaveBeenCalled();
      expect(result).toEqual([mockExercises[2]]);
    });
  });
});