from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from Auth.permissions import IsFarmer

CROP_DATA = {
    "potato": {
        "stages": {
            "fond": {"N": 800, "P": 0, "K": 0},
            "entretien": {"N": 200, "P": 0, "K": 100},
        },
        "water": 50000,
    },
    "lettuce": {
        "stages": {
            "fond": {"N": 300, "P": 200, "K": 400},
        },
        "water": 40000,
    },
    "onion": {
        "stages": {
            "fond": {"N": 0, "P": 800, "K": 0},
        },
        "water": 45000,
    },
    "pepper": {
        "stages": {
            "fond": {"N": 0, "P": 600, "K": 0},
            "couverture": {"N": 200, "P": 0, "K": 200},
        },
        "water": 55000,
    },
    "tomato": {
        "stages": {
            "fond": {"N": 133, "P": 133, "K": 134},
        },
        "water": 60000,
    },
}

class CalculateRequirementsView(APIView):
    permission_classes = [IsFarmer]

    def post(self, request):
        crop = request.data.get('crop')
        stage = request.data.get('stage')
        try:
            area = float(request.data.get('area', 0))
        except (ValueError, TypeError):
            area = 0

        if not crop or not stage or area <= 0:
            return Response(
                {"N": 0, "P": 0, "K": 0, "water": 0},
                status=status.HTTP_200_OK
            )

        crop_info = CROP_DATA.get(crop)
        if not crop_info:
            return Response(
                {"error": f"Crop {crop} not found in calculator database."},
                status=status.HTTP_400_BAD_REQUEST
            )

        rates = crop_info["stages"].get(stage)
        if not rates:
            return Response(
                {"error": f"Stage {stage} not valid for crop {crop}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({
            "N": rates.get("N", 0) * area,
            "P": rates.get("P", 0) * area,
            "K": rates.get("K", 0) * area,
            "water": crop_info["water"] * area
        }, status=status.HTTP_200_OK)
