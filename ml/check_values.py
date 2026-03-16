import sys, subprocess
sys.path.insert(0, '.')

result = subprocess.run(
    [sys.executable, '-m', 'pytest',
     'server/tests/test_calorie_ml.py::TestCaloriePredictionService::test_realistic_food_values',
     '-v', '--tb=long', '-s'],
    capture_output=True, text=True, cwd='.'
)
print('STDOUT:')
print(result.stdout)
print('STDERR:')
print(result.stderr[-500:])
