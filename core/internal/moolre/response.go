package moolre

type Response struct {
	Status int         `json:"status"`
	Data   interface{} `json:"data"`
	Error  string      `json:"error,omitempty"`
}

type SuccessResponse struct {
	Status int `json:"status"`
	Data   struct {
		Message string `json:"message"`
	} `json:"data"`
}

type ErrorResponse struct {
	Status  int    `json:"status"`
	Message string `json:"message"`
	Error   string `json:"error,omitempty"`
}

func IsSuccess(resp *Response) bool {
	return resp.Status == 200 || resp.Status == 201
}

func ErrorMessage(resp *Response) string {
	if resp.Error != "" {
		return resp.Error
	}
	return "unknown error"
}

func IsSuccessStatus(status int) bool {
	return status == 200 || status == 201
}
